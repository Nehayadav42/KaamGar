// Plain, readable emails. Every value that goes into the HTML is escaped.
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c])

const shell = (bodyHtml) => `<!doctype html><html><body style="margin:0;background:#f1ede5;font-family:Arial,Helvetica,sans-serif;color:#1f211e">
<div style="max-width:520px;margin:0 auto;padding:32px 20px">
  <p style="font-family:Georgia,serif;font-size:22px;margin:0 0 24px">KaamGar</p>
  <div style="background:#faf8f4;border-radius:16px;padding:28px">${bodyHtml}</div>
  <p style="font-size:12px;color:#6f6d66;margin:20px 4px 0">If you weren’t expecting this email, you can safely ignore it.</p>
</div></body></html>`

const button = (link, label) =>
  `<p style="margin:24px 0"><a href="${esc(link)}" style="background:#a14537;color:#fff;text-decoration:none;padding:12px 22px;border-radius:10px;font-weight:bold;display:inline-block">${esc(label)}</a></p>
   <p style="font-size:12px;color:#6f6d66;word-break:break-all">Or paste this link into your browser:<br>${esc(link)}</p>`

export function inviteEmail({ name, email, cooperativeName, invitedBy, link, hours }) {
  const subject = 'You’ve been invited to KaamGar as a cooperative owner'
  const days = hours % 24 === 0 ? `${hours / 24} days` : `${hours} hours`
  const text = `Hello ${name},

${invitedBy} has invited you to be a cooperative owner on KaamGar for ${cooperativeName}.

Your sign-in email: ${email}

Set your password here (the link works for ${days} and only once):
${link}

After that, sign in with the "Cooperative Owner" option on the KaamGar home page.

If you weren't expecting this, ignore this email.`
  const html = shell(`<h1 style="font-family:Georgia,serif;font-weight:normal;font-size:24px;margin:0 0 12px">Welcome, ${esc(name)}.</h1>
    <p style="line-height:1.6;margin:0 0 8px">${esc(invitedBy)} has invited you to be a <strong>cooperative owner</strong> on KaamGar for <strong>${esc(cooperativeName)}</strong>.</p>
    <p style="line-height:1.6;margin:0">Your sign-in email: <strong>${esc(email)}</strong></p>
    ${button(link, 'Set your password')}
    <p style="font-size:13px;color:#6f6d66;margin:0">This link works for ${esc(days)} and only once.</p>`)
  return { subject, text, html }
}

export function resetEmail({ name, link, minutes }) {
  const subject = 'Reset your KaamGar password'
  const when = minutes >= 120 ? `${Math.round(minutes / 60)} hours` : `${minutes} minutes`
  const text = `Hello ${name},

Use this link to choose a new password (it works for ${when} and only once):
${link}

If you didn't ask for this, ignore this email. Your password will stay as it is.`
  const html = shell(`<h1 style="font-family:Georgia,serif;font-weight:normal;font-size:24px;margin:0 0 12px">Choose a new password</h1>
    <p style="line-height:1.6;margin:0">Hello ${esc(name)}, use the button below to choose a new password.</p>
    ${button(link, 'Choose a new password')}
    <p style="font-size:13px;color:#6f6d66;margin:0">This link works for ${esc(when)} and only once.</p>`)
  return { subject, text, html }
}
