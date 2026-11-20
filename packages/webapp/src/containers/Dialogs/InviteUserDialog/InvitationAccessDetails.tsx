import { Button, Callout, InputGroup, Intent } from '@blueprintjs/core';
import { useRef, useState } from 'react';
import type { InvitationAccessDetails as AccessDetails } from '@bigcapital/sdk-ts';
import { CLASSES } from '@/constants/classes';

export function InvitationAccessDetails({
  invitation,
  onClose,
}: {
  invitation: AccessDetails;
  onClose: () => void;
}) {
  const linkRef = useRef<HTMLInputElement>(null);
  const [copied, setCopied] = useState(false);
  const [copyFailed, setCopyFailed] = useState(false);

  const copyLink = async () => {
    setCopyFailed(false);
    try {
      if (window.navigator.clipboard?.writeText) {
        await window.navigator.clipboard.writeText(invitation.acceptUrl);
      } else {
        // Local HTTP installations may not expose the Clipboard API.
        linkRef.current?.select();
        if (!document.execCommand('copy')) throw new Error('Copy unavailable');
      }
      setCopied(true);
    } catch {
      linkRef.current?.select();
      setCopyFailed(true);
    }
  };

  return (
    <>
      <div className={CLASSES.DIALOG_BODY}>
        <Callout
          title="Invitation created"
          intent={
            invitation.emailDelivery.status === 'sent'
              ? Intent.SUCCESS
              : Intent.WARNING
          }
        >
          {invitation.emailDelivery.message}
        </Callout>
        <p>
          Share these details privately with the new user. They can set their
          own password using the invitation link, including on your local
          network.
        </p>
        <label htmlFor="invitation-email">Login email</label>
        <InputGroup id="invitation-email" value={invitation.email} readOnly />
        <label htmlFor="invitation-login-url">Login page</label>
        <InputGroup
          id="invitation-login-url"
          value={invitation.loginUrl}
          readOnly
        />
        <label htmlFor="invitation-accept-url">Invitation link</label>
        <InputGroup
          id="invitation-accept-url"
          inputRef={linkRef}
          value={invitation.acceptUrl}
          readOnly
        />
        <p>
          Valid for {invitation.expiresInHours} hours and one use. Copy it
          before closing this window.
        </p>
        <Button onClick={copyLink}>
          {copied ? 'Link copied' : 'Copy invitation link'}
        </Button>
        {copyFailed && (
          <p role="status">
            Automatic copy is unavailable. Select and copy the invitation link
            above.
          </p>
        )}
      </div>
      <div className={CLASSES.DIALOG_FOOTER}>
        <div className={CLASSES.DIALOG_FOOTER_ACTIONS}>
          <Button intent={Intent.PRIMARY} onClick={onClose}>
            Done
          </Button>
        </div>
      </div>
    </>
  );
}
