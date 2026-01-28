function clampNumber(val, min, max, fallback = 0) {
    const n = Number(val);
    if (Number.isNaN(n)) return fallback;
    return Math.max(min, Math.min(max, n));
  }
  
  function toStringArray(x, limit = 12) {
    if (!Array.isArray(x)) return [];
    return x
      .map(v => (v == null ? '' : String(v).trim()))
      .filter(Boolean)
      .slice(0, limit);
  }
  
  // updateIds should be strings in AI output; we keep as strings here.
  // Controller can map to ObjectIds safely if needed.
  function toIdArray(x, limit = 25) {
    if (!Array.isArray(x)) return [];
    return x.map(v => String(v)).filter(Boolean).slice(0, limit);
  }
  
  function sanitizeAIProgress(obj, fallbackPhase = 'phase1') {
    const allowedPhases = ['phase1', 'phase2', 'final'];
  
    const progressScore = clampNumber(obj?.progressScore, 0, 100, 0);
    const phaseFit = allowedPhases.includes(obj?.phaseFit) ? obj.phaseFit : fallbackPhase;
  
    const summary = String(obj?.summary || '').trim().slice(0, 900);
  
    const strengths = toStringArray(obj?.strengths);
    const risks = toStringArray(obj?.risks);
    const nextActions = toStringArray(obj?.nextActions);
    const missingInfo = toStringArray(obj?.missingInfo);
  
    const evidence = {
      updateIds: toIdArray(obj?.evidence?.updateIds),
      docNames: toStringArray(obj?.evidence?.docNames, 30),
      links: toStringArray(obj?.evidence?.links, 30)
    };
  
    const rawModel = String(obj?.rawModel || '').slice(0, 80);
  
    return {
      progressScore,
      phaseFit,
      summary,
      strengths,
      risks,
      nextActions,
      missingInfo,
      evidence,
      rawModel,
      rawPromptVersion: 'v1'
    };
  }
  
  module.exports = { sanitizeAIProgress };