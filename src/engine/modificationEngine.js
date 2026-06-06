// Smart Modification Engine for Raja Rocket Flow
// Suggests pose modifications based on experience levels and injury filters

const MODIFICATION_RULES = {
  wrist: {
    match: { target_body_parts: ['Wrists'] },
    modifications: {
      beginner: {
        action: 'replace',
        alternative: 'Downward-Facing Dog on Fists',
        note: 'Make fists to reduce wrist angle, or use wrist wedges'
      },
      intermediate: {
        action: 'adjust',
        note: 'Shift weight back, warm up wrists between poses'
      },
      advanced: {
        action: 'adjust',
        note: 'Use Dolphin Pose as alternative for Plank/Chaturanga'
      },
    },
  },
  knee: {
    match: { target_body_parts: ['Knees'], english_name: ['Lotus Pose', 'Hero Pose', 'Garland Pose'] },
    modifications: {
      beginner: {
        action: 'replace',
        alternative: 'Easy Seat (Sukhasana)',
        note: 'Sit on a block, keep knees level with hips'
      },
      intermediate: {
        action: 'adjust',
        note: 'Place blanket under knees, reduce pose depth'
      },
      advanced: {
        action: 'adjust',
        note: 'Use Half Lotus if knee allows, with support under bent knee'
      },
    },
  },
  back: {
    match: { target_body_parts: ['Lower Back', 'Spine'] },
    modifications: {
      beginner: {
        action: 'reduce',
        note: 'Reduce forward fold depth by 50%, keep spine long, use blocks'
      },
      intermediate: {
        action: 'adjust',
        note: 'Bend knees in forward folds, engage core for backbends'
      },
      advanced: {
        action: 'adjust',
        note: 'Focus on pelvic tilt control, avoid over-arching in backbends'
      },
    },
  },
  shoulder: {
    match: { target_body_parts: ['Shoulders'] },
    modifications: {
      beginner: {
        action: 'reduce',
        note: 'Reduce shoulder range of motion by 30%, use strap for binds'
      },
      intermediate: {
        action: 'adjust',
        note: 'Reduce range of motion in shoulder openers'
      },
      advanced: {
        action: 'adjust',
        note: 'Warm up shoulders thoroughly, use block between hands'
      },
    },
  },
  neck: {
    match: { target_body_parts: ['Neck'] },
    modifications: {
      beginner: {
        action: 'replace',
        alternative: 'Supported Bridge instead of Shoulderstand',
        note: 'Avoid inversions that compress neck'
      },
      intermediate: {
        action: 'adjust',
        note: 'Use blanket under shoulders in Shoulderstand, keep neck long'
      },
      advanced: {
        action: 'adjust',
        note: 'Prepare neck thoroughly, keep cervical curve'
      },
    },
  },
  hamstring: {
    match: { target_body_parts: ['Hamstrings'] },
    modifications: {
      beginner: {
        action: 'reduce',
        note: 'Use deep knee bends in forward folds, blocks at highest height'
      },
      intermediate: {
        action: 'adjust',
        note: 'Keep micro-bend in knees, use strap for supine stretches'
      },
      advanced: {
        action: 'adjust',
        note: 'Warm up hamstrings with dynamic movement before static holds'
      },
    },
  },
};

const EXPERIENCE_GUIDANCE = {
  beginner: 'Focus on alignment fundamentals. Reduce hold times to 3-5 breaths. Use props freely. Avoid complex transitions.',
  intermediate: 'Deepen expressions of poses while maintaining alignment. 5-8 breath holds, vinyasa-style transitions.',
  advanced: 'Explore advanced variations, longer holds, and complex transitions. 8-10 breath holds, power vinyasa flow.',
};

export function getModifications(pose, activeFilters, experienceLevel) {
  if (!activeFilters || activeFilters.length === 0) return null;
  const modifications = [];

  for (const filterId of activeFilters) {
    const rule = MODIFICATION_RULES[filterId];
    if (!rule) continue;

    const matchesBodyPart = rule.match.target_body_parts
      ? rule.match.target_body_parts.some(bp => pose.target_body_parts.includes(bp))
      : true;
    const matchesName = rule.match.english_name
      ? rule.match.english_name.some(name => pose.english_name.toLowerCase().includes(name.toLowerCase()))
      : true;

    if (matchesBodyPart && matchesName) {
      const mod = rule.modifications[experienceLevel] || rule.modifications.intermediate;
      if (mod) {
        modifications.push({ filter: filterId, ...mod });
      }
    }
  }

  return modifications.length > 0 ? modifications : null;
}

export function getExperienceGuidance(experienceLevel) {
  return EXPERIENCE_GUIDANCE[experienceLevel] || EXPERIENCE_GUIDANCE.intermediate;
}

export function shouldFilterOut(pose, activeFilters, experienceLevel) {
  if (!activeFilters || activeFilters.length === 0) return false;
  for (const filterId of activeFilters) {
    const rule = MODIFICATION_RULES[filterId];
    if (!rule) continue;
    const matchesBodyPart = rule.match.target_body_parts
      ? rule.match.target_body_parts.some(bp => pose.target_body_parts.includes(bp))
      : true;
    if (matchesBodyPart) {
      const mod = rule.modifications[experienceLevel] || rule.modifications.intermediate;
      if (mod && mod.action === 'replace' && experienceLevel === 'beginner') return true;
    }
  }
  return false;
}

export function getAllModificationsForPoses(poses, activeFilters, experienceLevel) {
  const result = {};
  for (const pose of poses) {
    const mods = getModifications(pose, activeFilters, experienceLevel);
    if (mods) result[pose.english_name] = mods;
  }
  return result;
}