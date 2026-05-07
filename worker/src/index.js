export default {
  async fetch(request, env) {
    const origin = request.headers.get("Origin") || "";
    const allowed = env.ALLOWED_ORIGIN || "https://macbuddy.atlai.co.uk";

    const corsHeaders = {
      "Access-Control-Allow-Origin": allowed,
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    };

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    if (request.method !== "POST") {
      return Response.json(
        { error: "Method not allowed" },
        { status: 405, headers: corsHeaders }
      );
    }

    // Basic origin check
    if (origin && !origin.startsWith(allowed)) {
      return Response.json(
        { error: "Forbidden" },
        { status: 403, headers: corsHeaders }
      );
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return Response.json(
        { error: "Invalid JSON" },
        { status: 400, headers: corsHeaders }
      );
    }

    const { kind, title, description, environment, steps, contact } = body;

    // Validate required fields
    if (!kind || !title || !description) {
      return Response.json(
        { error: "Missing required fields: kind, title, description" },
        { status: 400, headers: corsHeaders }
      );
    }

    const validKinds = ["bug", "feature", "question"];
    if (!validKinds.includes(kind)) {
      return Response.json(
        { error: "Invalid kind" },
        { status: 400, headers: corsHeaders }
      );
    }

    // Rate limiting via CF (simple: just limit body size)
    if (title.length > 200 || description.length > 5000) {
      return Response.json(
        { error: "Title or description too long" },
        { status: 400, headers: corsHeaders }
      );
    }

    // Build issue body
    const issueBody = buildIssueBody(kind, { description, environment, steps, contact });

    const labels = {
      bug: ["bug"],
      feature: ["enhancement"],
      question: ["question"],
    };

    const issueTitle = `[${kind.charAt(0).toUpperCase() + kind.slice(1)}] ${title}`;

    // Create GitHub issue
    const ghRes = await fetch(
      `https://api.github.com/repos/${env.GITHUB_REPO}/issues`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${env.GITHUB_PAT}`,
          Accept: "application/vnd.github+json",
          "User-Agent": "MacBuddy-Issue-Worker",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: issueTitle,
          body: issueBody,
          labels: labels[kind] || [],
        }),
      }
    );

    if (!ghRes.ok) {
      const errText = await ghRes.text();
      console.error("GitHub API error:", ghRes.status, errText);
      return Response.json(
        { error: "Failed to create issue" },
        { status: 502, headers: corsHeaders }
      );
    }

    const issue = await ghRes.json();

    return Response.json(
      { success: true, issue_url: issue.html_url, issue_number: issue.number },
      { status: 201, headers: corsHeaders }
    );
  },
};

function buildIssueBody(kind, data) {
  const { description, environment, steps, contact } = data;
  let body = "";

  if (kind === "bug") {
    body += `### What happened?\n${description}\n\n`;
    if (steps) body += `### Steps to reproduce\n${steps}\n\n`;
    if (environment) body += `### Environment\n${environment}\n\n`;
  } else if (kind === "feature") {
    body += `### What's the feature?\n${description}\n\n`;
  } else {
    body += `### Question\n${description}\n\n`;
    if (environment) body += `### Environment\n${environment}\n\n`;
  }

  if (contact) body += `### Contact\n${contact}\n\n`;

  body += `---\n*Submitted via [MacBuddy Support](https://macbuddy.atlai.co.uk/support.html)*`;
  return body;
}
