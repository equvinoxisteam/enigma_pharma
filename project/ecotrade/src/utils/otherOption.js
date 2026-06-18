export const OTHER_MARKER_VALUES = ['Other', 'OTHER', 'Others', 'other'];

export function isOtherValue(value) {
  if (value == null || value === '') return false;
  return OTHER_MARKER_VALUES.includes(String(value));
}

export function resolveOtherValue(selected, customText) {
  const custom = customText?.trim();
  if (isOtherValue(selected)) {
    return custom || selected;
  }
  return selected;
}

export function resolveOtherInArray(items, customText, markers = ['OTHER', 'Others']) {
  if (!items?.length) return items || [];
  const custom = customText?.trim();
  if (!custom) return items;
  return items.map((item) => (markers.includes(item) ? custom : item));
}

export function arrayIncludesOther(items, markers = ['OTHER', 'Others']) {
  return items?.some((item) => markers.includes(item));
}

export function resolveTechnologiesWithOther(technologies, customText) {
  const custom = customText?.trim();
  return (technologies || []).flatMap((tech) => {
    if (tech === 'OTHER') {
      return custom ? [custom] : [];
    }
    return [tech];
  });
}

export function otherRequiredError(selected, customText, label) {
  if (isOtherValue(selected) && !customText?.trim()) {
    return `Please specify ${label} when Other is selected`;
  }
  return null;
}

export function otherArrayRequiredError(items, customText, markers, label) {
  if (arrayIncludesOther(items, markers) && !customText?.trim()) {
    return `Please specify ${label} when Other is selected`;
  }
  return null;
}
