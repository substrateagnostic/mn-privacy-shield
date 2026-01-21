// Field matching heuristics for privacy opt-out forms
// Matches form fields by name, id, placeholder, aria-label, autocomplete, and nearby labels

export const FIELD_PATTERNS = {
  firstName: {
    attributes: ['first', 'fname', 'given', 'forename'],
    autocomplete: ['given-name'],
    labels: ['first name', 'given name', 'forename']
  },
  lastName: {
    attributes: ['last', 'lname', 'surname', 'family'],
    autocomplete: ['family-name'],
    labels: ['last name', 'surname', 'family name']
  },
  fullName: {
    attributes: ['name', 'fullname', 'full_name'],
    autocomplete: ['name'],
    labels: ['name', 'full name', 'your name']
  },
  email: {
    attributes: ['email', 'mail', 'e-mail'],
    autocomplete: ['email'],
    labels: ['email', 'e-mail', 'email address'],
    types: ['email']
  },
  phone: {
    attributes: ['phone', 'tel', 'mobile', 'cell'],
    autocomplete: ['tel'],
    labels: ['phone', 'telephone', 'mobile', 'cell'],
    types: ['tel']
  },
  address: {
    attributes: ['address', 'street', 'addr', 'address1', 'address_line_1'],
    autocomplete: ['street-address', 'address-line1'],
    labels: ['address', 'street address', 'address line 1']
  },
  city: {
    attributes: ['city', 'locality', 'town'],
    autocomplete: ['address-level2'],
    labels: ['city', 'town', 'locality']
  },
  state: {
    attributes: ['state', 'region', 'province'],
    autocomplete: ['address-level1'],
    labels: ['state', 'province', 'region']
  },
  zip: {
    attributes: ['zip', 'postal', 'postcode', 'zipcode'],
    autocomplete: ['postal-code'],
    labels: ['zip', 'zip code', 'postal code', 'postcode']
  },
  country: {
    attributes: ['country'],
    autocomplete: ['country', 'country-name'],
    labels: ['country']
  }
};

// Common request type checkboxes/radios
export const REQUEST_PATTERNS = {
  delete: ['delete', 'erasure', 'remove', 'forget'],
  optOut: ['opt-out', 'optout', 'opt out', 'do not sell', 'dns', 'dnsmpi', 'stop selling', 'stop sale'],
  access: ['access', 'know', 'copy', 'download', 'portability'],
  correct: ['correct', 'rectify', 'update', 'fix']
};

/**
 * Check if a string matches any pattern in a list
 */
function matchesAny(str, patterns) {
  if (!str) return false;
  const lower = str.toLowerCase();
  return patterns.some(p => lower.includes(p.toLowerCase()));
}

/**
 * Get the associated label text for an input element
 */
function getLabelText(input) {
  // Check for explicit label via 'for' attribute
  if (input.id) {
    const label = document.querySelector(`label[for="${input.id}"]`);
    if (label) return label.textContent.trim();
  }

  // Check for parent label
  const parentLabel = input.closest('label');
  if (parentLabel) return parentLabel.textContent.trim();

  // Check for aria-label
  if (input.getAttribute('aria-label')) {
    return input.getAttribute('aria-label');
  }

  // Check for aria-labelledby
  const labelledBy = input.getAttribute('aria-labelledby');
  if (labelledBy) {
    const labelEl = document.getElementById(labelledBy);
    if (labelEl) return labelEl.textContent.trim();
  }

  // Check preceding sibling or nearby text
  const prev = input.previousElementSibling;
  if (prev && (prev.tagName === 'LABEL' || prev.tagName === 'SPAN')) {
    return prev.textContent.trim();
  }

  return '';
}

/**
 * Detect what field type an input element is
 */
export function detectFieldType(input) {
  const name = input.name || '';
  const id = input.id || '';
  const placeholder = input.placeholder || '';
  const autocomplete = input.autocomplete || '';
  const type = input.type || '';
  const labelText = getLabelText(input);

  for (const [fieldType, patterns] of Object.entries(FIELD_PATTERNS)) {
    // Check type attribute
    if (patterns.types && patterns.types.includes(type)) {
      return fieldType;
    }

    // Check autocomplete attribute
    if (patterns.autocomplete && patterns.autocomplete.some(a => autocomplete.includes(a))) {
      return fieldType;
    }

    // Check name, id, placeholder attributes
    if (patterns.attributes) {
      if (matchesAny(name, patterns.attributes) ||
          matchesAny(id, patterns.attributes) ||
          matchesAny(placeholder, patterns.attributes)) {
        return fieldType;
      }
    }

    // Check label text
    if (patterns.labels && matchesAny(labelText, patterns.labels)) {
      return fieldType;
    }
  }

  return null;
}

/**
 * Detect request type checkboxes/radios
 */
export function detectRequestType(input) {
  const name = input.name || '';
  const id = input.id || '';
  const value = input.value || '';
  const labelText = getLabelText(input);

  for (const [requestType, patterns] of Object.entries(REQUEST_PATTERNS)) {
    if (matchesAny(name, patterns) ||
        matchesAny(id, patterns) ||
        matchesAny(value, patterns) ||
        matchesAny(labelText, patterns)) {
      return requestType;
    }
  }

  return null;
}

/**
 * Find all fillable form fields on the page
 */
export function findFormFields() {
  const inputs = document.querySelectorAll('input, select, textarea');
  const fields = {};

  inputs.forEach(input => {
    // Skip hidden, submit, button types
    if (['hidden', 'submit', 'button', 'image', 'reset'].includes(input.type)) {
      return;
    }

    const fieldType = detectFieldType(input);
    if (fieldType) {
      if (!fields[fieldType]) {
        fields[fieldType] = [];
      }
      fields[fieldType].push(input);
    }
  });

  return fields;
}

/**
 * Find request type checkboxes
 */
export function findRequestCheckboxes() {
  const inputs = document.querySelectorAll('input[type="checkbox"], input[type="radio"]');
  const checkboxes = {};

  inputs.forEach(input => {
    const requestType = detectRequestType(input);
    if (requestType) {
      if (!checkboxes[requestType]) {
        checkboxes[requestType] = [];
      }
      checkboxes[requestType].push(input);
    }
  });

  return checkboxes;
}
