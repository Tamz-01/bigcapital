#!/usr/bin/env python3
"""Start the isolated, demo-only BigCapital baseline. Never use for client data."""
import os
import re
import secrets
import subprocess
import sys
import time
from urllib.request import urlopen
from pathlib import Path

ROOT = Path(__file__).resolve().parent
os.chdir(ROOT)
ENV = ROOT / '.env.test'
COMPOSE = ['docker', 'compose', '--env-file', str(ENV), '-f', 'docker-compose.test.yml']

def run(*args, check=True):
    result = subprocess.run(COMPOSE + list(args), text=True, capture_output=True)
    if check and result.returncode:
        raise RuntimeError('Command failed: ' + ' '.join(args) + '\n' + result.stderr[-2500:])
    return result

def read_env(path):
    return dict(line.split('=', 1) for line in path.read_text().splitlines()
                if line and not line.startswith('#') and '=' in line)

def save_env(values):
    ENV.write_text(''.join(f'{key}={value}\n' for key, value in values.items()))
    ENV.chmod(0o600)

def prepare():
    values = read_env(ENV if ENV.exists() else ROOT / '.env.example')
    if not ENV.exists():
        for key in ('DB_PASSWORD', 'DB_ROOT_PASSWORD', 'APP_JWT_SECRET',
                    'CLICKHOUSE_PASSWORD', 'GARAGE_RPC_SECRET', 'GARAGE_ADMIN_TOKEN'):
            values[key] = secrets.token_hex(32)
    host = os.environ.get('CODESPACE_NAME')
    values.update(BASE_URL=(f'https://{host}-8080.app.github.dev' if host else 'http://localhost:8080'),
                  GOTENBERG_URL='http://gotenberg:3000', GOTENBERG_DOCS_URL='http://server:3000/public/',
                  HOSTED_ON_BIGCAPITAL_CLOUD='false', SIGNUP_EMAIL_CONFIRMATION='false',
                  CLICKHOUSE_ENABLED='false')
    save_env(values)
    return values

def garage(*args, check=True):
    return run('exec', '-T', 'garage', '/garage', *args, check=check)

def start():
    for built in ('packages/server/dist/main.js', 'packages/webapp/dist/index.html'):
        if not (ROOT / built).is_file():
            raise RuntimeError('Build source first: pnpm install --frozen-lockfile && pnpm run build:server && pnpm run build:webapp. See TESTING.md.')
    values = prepare()
    print('Starting isolated database, queue, PDF and document services...', flush=True)
    run('up', '-d', 'mysql', 'redis', 'garage', 'gotenberg')
    for _ in range(90):
        if run('exec', '-T', 'mysql', 'mysqladmin', 'ping', '--silent', check=False).returncode == 0:
            break
        time.sleep(2)
    else:
        raise RuntimeError('Database did not become ready; inspect the mysql service logs.')
    print('Preparing document storage...', flush=True)
    for _ in range(30):
        status = garage('status', check=False)
        if status.returncode == 0:
            break
        time.sleep(2)
    else:
        raise RuntimeError('Garage did not become ready.')
    if 'NO ROLE ASSIGNED' in status.stdout.upper():
        node = re.search(r'^([a-fA-F0-9]{16,64})\s', status.stdout, re.M)
        if not node:
            raise RuntimeError('Cannot determine Garage node ID.')
        garage('layout', 'assign', node.group(1), '-z', 'test', '-c', '1G')
        garage('layout', 'apply', '--version', '1')
        time.sleep(3)
    if not values.get('S3_ACCESS_KEY_ID'):
        key_name = 'test-' + secrets.token_hex(4)
        created = garage('key', 'create', key_name)
        key_id = re.search(r'Key ID:\s*(\S+)', created.stdout)
        secret = re.search(r'Secret key:\s*(\S+)', created.stdout, re.I)
        if not key_id or not secret:
            raise RuntimeError('Cannot read newly generated storage credentials.')
        values['S3_ACCESS_KEY_ID'] = key_id.group(1)
        values['S3_SECRET_ACCESS_KEY'] = secret.group(1)
        save_env(values)
    if garage('bucket', 'info', 'bigcapital', check=False).returncode:
        garage('bucket', 'create', 'bigcapital')
    garage('bucket', 'allow', '--read', '--write', '--owner', '--key', values['S3_ACCESS_KEY_ID'], 'bigcapital')
    print('Running system database migrations...', flush=True)
    run('run', '--rm', '--no-deps', 'server', 'node', '/app/packages/server/dist/cli.js', 'system:migrate:latest')
    print('Running tenant database migrations...', flush=True)
    run('run', '--rm', '--no-deps', 'server', 'node', '/app/packages/server/dist/cli.js', 'tenants:migrate:latest')
    print('Building the test banner and starting BigCapital...', flush=True)
    run('build', 'webapp')
    run('up', '-d', '--force-recreate', 'server', 'webapp', 'proxy')
    for _ in range(60):
        try:
            with urlopen('http://127.0.0.1:8080/api/system_db', timeout=3) as response:
                if response.status == 200:
                    break
        except OSError:
            pass
        time.sleep(2)
    else:
        raise RuntimeError('API did not become ready; inspect the server and proxy logs.')
    print('Test app: ' + values['BASE_URL'], flush=True)
    print('Keep port 8080 private. Use demo data only. See TESTING.md.', flush=True)

if __name__ == '__main__':
    try:
        action = sys.argv[1] if len(sys.argv) > 1 else 'start'
        if action == 'start':
            start()
        elif action == 'stop':
            print(run('stop').stdout)
        elif action == 'status':
            print(run('ps').stdout)
        else:
            raise RuntimeError('Use: python3 test-app.py [start|stop|status]')
    except Exception as exc:
        print(str(exc), file=sys.stderr)
        sys.exit(1)
