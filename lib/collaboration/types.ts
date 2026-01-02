// Types for collaboration features (comments and suggestions)

export interface CommentReply {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  content: string;
  createdAt: number;
}

export interface Comment {
  id: string;
  documentId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  // Text selection
  selectionStart: number;
  selectionEnd: number;
  selectedText: string;
  // Comment content
  content: string;
  type: 'comment' | 'suggestion';
  suggestedText?: string; // For suggestions
  // Status
  resolved: boolean;
  // Timestamps
  createdAt: number;
  updatedAt: number;
  // Replies
  replies: CommentReply[];
}

export type CommentFilter = 'all' | 'open' | 'resolved';

export interface CreateCommentData {
  documentId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  selectionStart: number;
  selectionEnd: number;
  selectedText: string;
  content: string;
  type: 'comment' | 'suggestion';
  suggestedText?: string;
}

export interface UpdateCommentData {
  content?: string;
  resolved?: boolean;
  suggestedText?: string;
}

// Version History Types

/**
 * Represents a snapshot of a document at a specific point in time
 */
export interface DocumentVersion {
  /** Unique version identifier */
  id: string;

  /** Parent document ID */
  documentId: string;

  /** Sequential version number (1, 2, 3, ...) */
  versionNumber: number;

  // Content snapshot
  /** Document title at this version */
  title: string;

  /** Document content (HTML) at this version */
  content: string;

  /** Word count at this version */
  wordCount: number;

  // Author information
  /** User ID who created this version */
  userId: string;

  /** User name at time of version creation */
  userName: string;

  // Metadata
  /** Optional label like "Draft 1", "Final", "Pre-review" */
  label?: string;

  /** Optional description of changes made in this version */
  description?: string;

  // Timestamps
  /** Creation timestamp (milliseconds since epoch) */
  createdAt: number;

  // Version type
  /** Auto-save or manually saved version */
  type: 'auto' | 'manual';
}

/**
 * Options for creating a new version
 */
export interface CreateVersionOptions {
  /** Version type */
  type: 'auto' | 'manual';

  /** Optional label */
  label?: string;

  /** Optional description */
  description?: string;
}

/**
 * Version statistics and metadata
 */
export interface VersionStats {
  /** Total number of versions */
  totalVersions: number;

  /** Number of manual versions */
  manualVersions: number;

  /** Number of auto versions */
  autoVersions: number;

  /** Latest version */
  latestVersion?: DocumentVersion;

  /** Oldest version */
  oldestVersion?: DocumentVersion;
}

/**
 * Diff information between two versions
 */
export interface VersionDiff {
  /** Version being compared from */
  fromVersion: DocumentVersion;

  /** Version being compared to */
  toVersion: DocumentVersion;

  /** Word count change */
  wordCountDiff: number;

  /** Character count change */
  charCountDiff: number;

  /** Time elapsed between versions (milliseconds) */
  timeDiff: number;
}

// Document Sharing Types

/**
 * Permission levels for document sharing
 */
export type SharePermission = 'view' | 'comment' | 'edit';

/**
 * Represents a share of a document with another user or via link
 */
export interface DocumentShare {
  /** Unique share identifier */
  id: string;

  /** Parent document ID */
  documentId: string;

  // Share method
  /** Type of share - link or email invitation */
  type: 'link' | 'email';

  // For link sharing
  /** Cryptographically secure token for link sharing */
  shareToken?: string;

  // For email sharing
  /** Email address of the person being shared with */
  sharedWithEmail?: string;

  /** User ID if the email user exists in the system */
  sharedWithUserId?: string;

  // Permission level
  /** Permission level granted to the share recipient */
  permission: SharePermission;

  // Metadata
  /** User ID of the person who created the share */
  createdBy: string;

  /** Display name of the person who created the share */
  createdByName: string;

  /** Creation timestamp (milliseconds since epoch) */
  createdAt: number;

  /** Optional expiration timestamp (milliseconds since epoch) */
  expiresAt?: number;

  // Status
  /** Whether the share is currently active */
  active: boolean;
}

/**
 * Represents a document that has been shared with the current user
 */
export interface SharedDocument {
  /** Document ID */
  documentId: string;

  /** Document title */
  title: string;

  /** Display name of the document owner */
  ownerName: string;

  /** User ID of the document owner */
  ownerId: string;

  /** Permission level the current user has */
  permission: SharePermission;

  /** Timestamp when the document was shared (milliseconds since epoch) */
  sharedAt: number;

  /** Last updated timestamp */
  updatedAt?: number;

  /** Word count */
  wordCount?: number;
}

// Track Changes Types

/**
 * Type of tracked change
 */
export type ChangeType = 'insertion' | 'deletion' | 'formatting';

/**
 * Represents a tracked change in the document
 */
export interface TrackedChange {
  /** Unique change identifier */
  id: string;

  /** Parent document ID */
  documentId: string;

  // Change info
  /** Type of change made */
  type: ChangeType;

  // Position
  /** Starting position in document */
  from: number;

  /** Ending position in document */
  to: number;

  // Content
  /** Original content (for deletions) */
  oldContent?: string;

  /** New content (for insertions) */
  newContent?: string;

  // Author
  /** User ID who made the change */
  userId: string;

  /** User name at time of change */
  userName: string;

  // Timestamp
  /** Creation timestamp (milliseconds since epoch) */
  createdAt: number;

  // Status
  /** Change status */
  status: 'pending' | 'accepted' | 'rejected';

  /** User ID who resolved the change */
  resolvedBy?: string;

  /** Resolution timestamp */
  resolvedAt?: number;
}

/**
 * Track changes state
 */
export interface TrackChangesState {
  /** Whether tracking is enabled */
  enabled: boolean;

  /** Whether changes are visible */
  showChanges: boolean;

  /** Array of tracked changes */
  changes: TrackedChange[];
}
