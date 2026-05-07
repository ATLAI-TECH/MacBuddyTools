// MacBuddy landing — wire up "Report bug / Suggest feature / Ask question"
// to GitHub's pre-fill issue URL. No tokens involved: GitHub handles auth
// when the user lands on the page.

(function () {
  const REPO = 'ATLAI-TECH/MacBuddyTools';

  const TEMPLATES = {
    bug: {
      title: '[Bug] ',
      labels: ['bug'],
      body:
`### What happened?
<!-- Describe the bug clearly. What did you see? What did you expect? -->

### Steps to reproduce
1.
2.
3.

### Environment
- macOS version:
- MacBuddy version:
- Mac model (Apple Silicon / Intel):

### Screenshots / logs
<!-- Optional. Drop images or Console.app excerpts here. -->
`
    },
    feature: {
      title: '[Feature] ',
      labels: ['enhancement'],
      body:
`### What's the feature?
<!-- Describe the tool / capability you'd like inside MacBuddy. -->

### Why is it useful?
<!-- Who uses it, how often, what problem does it save? -->

### Anything similar elsewhere?
<!-- Optional. Links / screenshots of other apps doing this. -->
`
    },
    question: {
      title: '[Question] ',
      labels: ['question'],
      body:
`### What are you trying to do?
<!-- Permissions? Hotkey conflicts? Build issue? -->

### What have you tried?
<!-- Quick list of what you've already attempted. -->

### Environment
- macOS version:
- MacBuddy version:
`
    }
  };

  function buildIssueUrl(kind) {
    const tpl = TEMPLATES[kind];
    if (!tpl) return `https://github.com/${REPO}/issues/new`;

    const params = new URLSearchParams({
      title: tpl.title,
      body: tpl.body,
      labels: tpl.labels.join(',')
    });
    return `https://github.com/${REPO}/issues/new?${params.toString()}`;
  }

  document.querySelectorAll('[data-issue-kind]').forEach(card => {
    const kind = card.getAttribute('data-issue-kind');
    const url = buildIssueUrl(kind);
    card.setAttribute('href', url);
    card.setAttribute('target', '_blank');
    card.setAttribute('rel', 'noopener');
  });

  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();
})();
