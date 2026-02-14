// Data Broker types
export interface DataBroker {
  id: string;
  name: string;
  dba?: string;
  email: string;
  website: string;
  optOutUrl?: string;
  address?: string;
  city?: string;
  state?: string;
  category: BrokerCategory;
  collectsMinorData?: boolean;
  collectsGeolocation?: boolean;
}

export type BrokerCategory =
  | 'people-search'
  | 'location'
  | 'advertising'
  | 'aggregator'
  | 'background-check'
  | 'financial'
  | 'other';

// Request types matching MN AG templates
export type RequestType =
  | 'right-to-know'      // sub_b - 325M.14 subd. 2
  | 'correction'         // sub_c - 325M.14 subd. 3
  | 'deletion'           // sub_d - 325M.14 subd. 4
  | 'portability'        // sub_e - 325M.14 subd. 5
  | 'opt-out'            // sub_f - 325M.14 subd. 6
  | 'profiling-info'     // sub_g - 325M.14 subd. 7
  | 'third-party-list';  // sub_h - 325M.14 subd. 8

export interface RequestTypeInfo {
  id: RequestType;
  name: string;
  description: string;
  statute: string;
  templateFile: string;
}

export const REQUEST_TYPES: RequestTypeInfo[] = [
  {
    id: 'right-to-know',
    name: 'Right to Know',
    description: 'Confirm whether a company is processing your data and access the categories of data being processed',
    statute: '325M.14 subd. 2',
    templateFile: 'MCDPA_Template_Letter_sub_b.pdf'
  },
  {
    id: 'correction',
    name: 'Correction',
    description: 'Correct inaccurate personal data a company has about you',
    statute: '325M.14 subd. 3',
    templateFile: 'MCDPA_Template_Letter_sub_c.pdf'
  },
  {
    id: 'deletion',
    name: 'Deletion',
    description: 'Delete all personal data a company has collected about you',
    statute: '325M.14 subd. 4',
    templateFile: 'MCDPA_Template_Letter_sub_d.pdf'
  },
  {
    id: 'portability',
    name: 'Portability',
    description: 'Get a copy of your data in a portable, machine-readable format',
    statute: '325M.14 subd. 5',
    templateFile: 'MCDPA_Template_Letter_sub_e.pdf'
  },
  {
    id: 'opt-out',
    name: 'Opt-Out',
    description: 'Opt out of the sale of your data, targeted advertising, and profiling',
    statute: '325M.14 subd. 6',
    templateFile: 'MCDPA_Template_Letter_sub_f.pdf'
  },
  {
    id: 'profiling-info',
    name: 'Profiling Information',
    description: 'Get information about how automated profiling decisions affect you',
    statute: '325M.14 subd. 7',
    templateFile: 'MCDPA_Template_Letter_sub_g.pdf'
  },
  {
    id: 'third-party-list',
    name: 'Third-Party List',
    description: 'Get a list of specific third parties your data was sold or disclosed to',
    statute: '325M.14 subd. 8',
    templateFile: 'MCDPA_Template_Letter_sub_h.pdf'
  }
];

// User info for letter generation
export interface UserInfo {
  name: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  email: string;
}

// Request tracking
export interface TrackedRequest {
  id: string;
  brokerId: string;
  brokerName: string;
  requestTypes: RequestType[];
  userInfo?: UserInfo;
  dateSent: string;
  deadline: string; // 45 days from dateSent
  status: RequestStatus;
  notes?: string;
  responseDate?: string;
}

export type RequestStatus =
  | 'pending'      // Sent, waiting for response
  | 'acknowledged' // Company acknowledged receipt
  | 'completed'    // Request fulfilled
  | 'denied'       // Request denied
  | 'no-response'  // 45 days passed, no response
  | 'appealed';    // Filed internal appeal

// Deadline calculations
export const RESPONSE_DEADLINE_DAYS = 45;
export const CURE_PERIOD_DAYS = 30;

