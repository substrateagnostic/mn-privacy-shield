import { RequestType, UserInfo, DataBroker } from './types';

// Letter content generation based on MN AG templates
// Reference: https://ag.state.mn.us/Data-Privacy/Consumer/Letters/

export interface LetterContent {
  date: string;
  recipientName: string;
  recipientAddress: string;
  recipientEmail: string;
  recipientWebsite: string;
  optOutUrl?: string;
  subject: string;
  requestSummary: string; // Clear list of what's being requested
  body: string;
  userInfo: UserInfo;
  requestTypes: RequestType[];
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

// Request types that must be submitted as standalone letters
export const STANDALONE_ONLY_REQUESTS: RequestType[] = ['correction', 'profiling-info'];

// Check if any standalone-only requests are in the selection
export function hasStandaloneRequest(requestTypes: RequestType[]): boolean {
  return requestTypes.some(rt => STANDALONE_ONLY_REQUESTS.includes(rt));
}

// Split request types into combinable and standalone groups
export function splitRequestTypes(requestTypes: RequestType[]): {
  combinable: RequestType[];
  standalone: RequestType[];
} {
  const combinable = requestTypes.filter(rt => !STANDALONE_ONLY_REQUESTS.includes(rt));
  const standalone = requestTypes.filter(rt => STANDALONE_ONLY_REQUESTS.includes(rt));
  return { combinable, standalone };
}

interface RequestTypeContent {
  subject: string;
  citation: string; // e.g., "subd. 1(b) (Right to Know; see subd. 2)"
  paragraph: string;
  requiresUserInput?: boolean;
  inputPrompt?: string;
}

export function getRequestTypeContent(requestType: RequestType): RequestTypeContent {
  switch (requestType) {
    case 'right-to-know':
      return {
        subject: 'Right to Confirm and Access Personal Data',
        citation: 'subd. 1(b) (see also subd. 2)',
        paragraph: `I am writing pursuant to my rights under Minnesota Statutes section 325M.14, subd. 1(b) to request that you tell me whether your organization is processing personal data concerning me.

If your organization is processing personal data concerning me, please provide me with the categories of data that your organization is processing concerning me.`
      };

    case 'correction':
      return {
        subject: 'Correction of Inaccurate Personal Data',
        citation: 'subd. 1(c) (see also subd. 3)',
        paragraph: `I am writing pursuant to my rights under Minnesota Statutes section 325M.14, subd. 1(c) to request that you correct inaccurate personal data concerning me.

I am requesting the following corrections:

[CORRECTION_DETAILS]`,
        requiresUserInput: true,
        inputPrompt: 'Please describe what information is inaccurate and what the correct information should be:'
      };

    case 'deletion':
      return {
        subject: 'Deletion of Personal Data',
        citation: 'subd. 1(d) (see also subd. 4)',
        paragraph: `I am writing pursuant to my rights under Minnesota Statutes section 325M.14, subd. 1(d) to request that you delete all personal data concerning me that you hold, control, or process.`
      };

    case 'portability':
      return {
        subject: 'Data Portability Request',
        citation: 'subd. 1(e) (see also subd. 5)',
        paragraph: `I am writing pursuant to my rights under Minnesota Statutes section 325M.14, subd. 1(e) to request that you provide me with a copy of all personal data that you hold, control, or process which has been provided to you previously by, and is concerning me.

Please provide this data in a portable and, to the extent technically feasible, readily usable format that allows me to transmit the data to another controller without hindrance.`
      };

    case 'opt-out':
      return {
        subject: 'Opt-Out Request',
        citation: 'subd. 1(f) (see also subd. 6)',
        paragraph: `I am writing pursuant to my rights under Minnesota Statutes section 325M.14, subd. 1(f) to opt out of the following:

• The processing of personal data concerning me for purposes of targeted advertising.
• The sale of personal data concerning me.
• The use of personal data in profiling in furtherance of automated decisions that produce legal effects (or similarly significant effects) concerning me.

Note: Under Minnesota law, you are also required to honor universal opt-out mechanisms such as Global Privacy Control (GPC). Please ensure your systems recognize and respect such signals.`
      };

    case 'profiling-info':
      return {
        subject: 'Request Regarding Profiling Decision',
        citation: 'subd. 1(g) (see also subd. 7)',
        paragraph: `I am writing pursuant to my rights under Minnesota Statutes section 325M.14, subd. 1(g) regarding your recent profiling decision that was made using personal data concerning me.

Specifically, I write regarding the following profiling decision:

[PROFILING_DECISION_DETAILS]

I ask that you provide the following information:

• A full explanation of the reasons that the profiling resulted in this decision.
• A description of what actions I might have taken to secure a different result.
• A description of what actions I might take in the future to obtain a different result from the profiling.
• A copy of the personal data you used in the profiling action.

I would also like to contest and request review of the outcome of this profiling action and/or opt out of profiling in furtherance of these decisions in the future.`,
        requiresUserInput: true,
        inputPrompt: 'Please describe the specific profiling decision you are challenging (e.g., denied credit, insurance rate increase, etc.):'
      };

    case 'third-party-list':
      return {
        subject: 'Request for List of Third Parties',
        citation: 'subd. 1(h) (see also subd. 8)',
        paragraph: `I am writing pursuant to my rights under Minnesota Statutes section 325M.14, subd. 1(h) to request that you provide me with a list of specific third parties to which you have disclosed the personal data concerning me.

If your organization does not maintain data with sufficient specificity to determine where the above-specified data was transferred, I ask that you provide me with a list of specific third parties to whom you have disclosed any consumers' personal data.`
      };

    default:
      return {
        subject: 'Consumer Data Privacy Request',
        citation: '',
        paragraph: ''
      };
  }
}

function generateRequestSummary(requestTypes: RequestType[]): string {
  const summaries: Record<RequestType, string> = {
    'right-to-know': 'Confirm whether you process my data and provide categories',
    'correction': 'Correct inaccurate personal data',
    'deletion': 'Delete all personal data you hold about me',
    'portability': 'Provide a copy of my data in portable format',
    'opt-out': 'Opt out of sale, targeted advertising, and profiling',
    'profiling-info': 'Provide information about a profiling decision',
    'third-party-list': 'Provide list of third parties who received my data'
  };

  return requestTypes.map(rt => `• ${summaries[rt]}`).join('\n');
}

export function generateLetter(
  broker: DataBroker,
  requestTypes: RequestType[],
  userInfo: UserInfo,
  additionalInputs?: Record<RequestType, string>
): LetterContent {
  const date = formatDate(new Date());

  // Generate subject line
  const requestNames = requestTypes.map(rt => {
    const content = getRequestTypeContent(rt);
    return content.subject;
  });

  const subject = requestTypes.length === 1
    ? `MCDPA Request: ${requestNames[0]}`
    : `MCDPA Request: Multiple Rights (${requestTypes.length} requests)`;

  // Generate request summary for the header
  const requestSummary = generateRequestSummary(requestTypes);

  // Combine request paragraphs
  const paragraphs = requestTypes.map(rt => {
    const content = getRequestTypeContent(rt);
    let paragraph = content.paragraph;

    // Replace placeholders with user input if provided
    if (content.requiresUserInput && additionalInputs?.[rt]) {
      paragraph = paragraph.replace('[CORRECTION_DETAILS]', additionalInputs[rt]);
      paragraph = paragraph.replace('[PROFILING_DECISION_DETAILS]', additionalInputs[rt]);
    }

    return paragraph;
  });

  const combinedParagraphs = requestTypes.length === 1
    ? paragraphs[0]
    : paragraphs.join('\n\n---\n\n');

  const body = `${date}

${broker.name}

To whom it may concern:

THIS REQUEST INCLUDES:
${requestSummary}

---

${combinedParagraphs}

This request is submitted regarding the following person's data:

Name: ${userInfo.name}
Home address: ${userInfo.address}, ${userInfo.city}, ${userInfo.state} ${userInfo.zip}
Email address: ${userInfo.email}

I am making this request pursuant to the Minnesota Consumer Data Privacy Act, Minnesota Statutes sections 325M.10-325M.21 and the terms used herein should be construed as those terms are used in that Act.

Please send a response within 45 days consistent with your obligations under Minnesota Statutes section 325M.14, subdivision 11.

LEGAL NOTICE: The Minnesota Attorney General may seek civil penalties of up to $7,500 per violation, plus reasonable attorney's fees and costs. If you deny this request or fail to respond, I have the right to appeal your decision through your internal appeal process, and subsequently file a complaint with the Minnesota Attorney General.

Thank you,

${userInfo.name}
${userInfo.email}`;

  const recipientAddress = broker.address
    ? `${broker.address}${broker.city ? `, ${broker.city}` : ''}${broker.state ? `, ${broker.state}` : ''}`
    : '';

  return {
    date,
    recipientName: broker.name,
    recipientAddress,
    recipientEmail: broker.email,
    recipientWebsite: broker.website,
    optOutUrl: broker.optOutUrl,
    subject,
    requestSummary,
    body,
    userInfo,
    requestTypes
  };
}

// Generate letters - handles standalone vs combined logic
export function generateLetters(
  brokers: DataBroker[],
  requestTypes: RequestType[],
  userInfo: UserInfo,
  additionalInputs?: Record<RequestType, string>
): LetterContent[] {
  const { combinable, standalone } = splitRequestTypes(requestTypes);
  const letters: LetterContent[] = [];

  for (const broker of brokers) {
    // Generate one letter with all combinable request types
    if (combinable.length > 0) {
      letters.push(generateLetter(broker, combinable, userInfo, additionalInputs));
    }

    // Generate separate letters for each standalone request type
    for (const standaloneType of standalone) {
      letters.push(generateLetter(broker, [standaloneType], userInfo, additionalInputs));
    }
  }

  return letters;
}

// Get count of letters that will be generated
export function getLetterCount(brokerCount: number, requestTypes: RequestType[]): number {
  const { combinable, standalone } = splitRequestTypes(requestTypes);
  let count = 0;

  if (combinable.length > 0) {
    count += brokerCount; // One letter per broker for combinable types
  }

  count += standalone.length * brokerCount; // One letter per standalone type per broker

  return count;
}
