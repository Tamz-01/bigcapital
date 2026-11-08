FROM bigcapitalhq/webapp@sha256:7ce33209c225175264eca4a6adea9a398662ae1e3400d4d9a6857523cc2d4a56
COPY packages/webapp/dist/ /usr/share/nginx/html/
RUN sed -i 's@</body>@<div style="pointer-events:none;position:fixed;bottom:0;left:0;right:0;z-index:2147483647;background:#ffc400;color:#111;text-align:center;font:600 13px sans-serif;padding:6px">TEST SYSTEM - Demo data only | <a style="pointer-events:auto" href="https://github.com/Tamz-01/bigcapital" target="_blank" rel="noopener noreferrer">Source code</a></div></body>@' /usr/share/nginx/html/index.html
