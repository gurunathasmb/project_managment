// services/aiProgressEvaluator.js
const axios = require("axios");

/* -------------------- RAG: RETRIEVAL -------------------- */
function retrieveContext({ workspace, phase }) {
  if (!workspace) return {};

  const { project, updates = [], docs = [] } = workspace;

  return {
    project: {
      title: project?.title,
      domain: project?.domain,
      techStack: project?.techStack,
      description: project?.description,
      problemStatement: project?.problemStatement,
      objectives: project?.objectives,
      repoUrl: project?.repoUrl,
      demoUrl: project?.demoUrl,
      currentPhase: project?.currentPhase,
    },
    updates: updates.map(u => ({
      id: u._id,
      message: u.message,
      createdAt: u.createdAt,
    })),
    documents: docs.map(d => ({
      fileName: d.fileName,
      description: d.description,
    })),
    phase,
  };
}

/* -------------------- SCORE LOGIC (DETERMINISTIC) -------------------- */
function computeProgressScore(context) {
  let score = 0;

  // Core project clarity (40)
  if (context.project?.title) score += 5;
  if (context.project?.problemStatement) score += 10;
  if (context.project?.objectives?.length) score += 10;
  if (context.project?.description) score += 10;
  if (context.project?.techStack?.length) score += 5;

  // Evidence of work (30)
  score += Math.min(context.updates.length * 10, 20);
  score += Math.min(context.documents.length * 10, 10);

  // Deliverables (30)
  if (context.project?.repoUrl) score += 15;
  if (context.project?.demoUrl) score += 15;

  return Math.min(score, 100);
}

/* -------------------- RAG: AUGMENTATION -------------------- */
function buildPrompt(context) {
  return `
You are a college project guide evaluating student project progress.

RULES:
- Use ONLY the given data
- Do NOT assume anything
- If info is missing, list it under "missingInfo"
- Return ONLY valid JSON
- No markdown, no explanation

PROJECT:
${JSON.stringify(context.project, null, 2)}

UPDATES:
${JSON.stringify(context.updates, null, 2)}

DOCUMENTS:
${JSON.stringify(context.documents, null, 2)}

PHASE:
${context.phase}

IMPORTANT:
You MUST always return a numeric progressScore between 0 and 100.

Return JSON exactly like this:
{
  "progressScore": number,
  "phaseFit": "phase1" | "phase2" | "final",
  "summary": string,
  "strengths": string[],
  "risks": string[],
  "nextActions": string[],
  "missingInfo": string[],
  "evidence": {
    "updateIds": string[],
    "docNames": string[],
    "links": string[]
  },
  "rawModel": string
}
`;
}

/* -------------------- LOCAL LLM (OLLAMA) -------------------- */
async function callOllama(prompt) {
  const res = await axios.post("http://127.0.0.1:11434/api/generate", {
    model: "mistral",
    prompt,
    stream: false,
  });

  return res.data.response;
}

/* -------------------- MAIN RAG PIPELINE -------------------- */
async function evaluateProgressWithAI({ phase, workspace }) {
  // 1️⃣ Retrieve
  const context = retrieveContext({ workspace, phase });

  // 2️⃣ Augment
  const prompt = buildPrompt(context);

  // 3️⃣ Generate qualitative feedback
  const text = await callOllama(prompt);

  // 4️⃣ Extract JSON safely
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1) {
    throw new Error("Invalid AI response (no JSON)");
  }

  const parsed = JSON.parse(text.slice(start, end + 1));

  // 5️⃣ FORCE correct score (NO MORE 0 ISSUE)
  parsed.progressScore = computeProgressScore(context);

  parsed.phaseFit = ["phase1", "phase2", "final"].includes(parsed.phaseFit)
    ? parsed.phaseFit
    : phase;

  parsed.strengths = Array.isArray(parsed.strengths) ? parsed.strengths.slice(0, 8) : [];
  parsed.risks = Array.isArray(parsed.risks) ? parsed.risks.slice(0, 8) : [];
  parsed.nextActions = Array.isArray(parsed.nextActions) ? parsed.nextActions.slice(0, 8) : [];
  parsed.missingInfo = Array.isArray(parsed.missingInfo) ? parsed.missingInfo.slice(0, 8) : [];

  parsed.evidence = parsed.evidence || {};
  parsed.evidence.updateIds = parsed.evidence.updateIds || [];
  parsed.evidence.docNames = parsed.evidence.docNames || [];
  parsed.evidence.links = parsed.evidence.links || [];

  parsed.rawModel = "mistral (ollama-local)";

  return parsed;
}

module.exports = { evaluateProgressWithAI };