/** Codes are stable so the UI can translate them and point at the node or edge. */
export type GraphIssueCode =
  | 'no_trigger'
  | 'multiple_triggers'
  | 'duplicate_node_id'
  | 'unknown_node_type'
  | 'missing_config'
  | 'invalid_config'
  | 'edge_unknown_node'
  | 'invalid_port'
  | 'trigger_has_input'
  | 'cycle'
  | 'unreachable_node';

export interface GraphIssue {
  code: GraphIssueCode;
  nodeId?: string;
  edgeId?: string;
  /** Config field for `missing_config` / `invalid_config`, port for `invalid_port`. */
  field?: string;
  /** Node ids in order, for `cycle`. */
  path?: string[];
}
