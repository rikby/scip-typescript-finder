# Snapshot Validator Agent

Validates that actual scip-finder CLI output matches stored snapshots.

## When to Use

Use this agent when you need to:
- Verify scip-finder CLI output matches expected snapshots
- Test regression in search results
- Validate CLI behavior after code changes
- Ensure snapshot files are up-to-date

## Snapshot Format

Each snapshot file in `markdown-ticket/snapshot_*.txt` contains:
1. **Expected output**: Lines in format `file:line:column: [optional role]`
2. **COMMAND: line**: The CLI command that generated the output (at end of file)

Example:
```
shared/models/Ticket.ts:6:18: Definition
shared/models/Ticket.ts:65:50:

COMMAND: scip-finder Ticket --from shared/models/Ticket.ts
```

## Workflow

### Step 1: Discover Snapshots

Find all snapshot files:
```bash
ls markdown-ticket/snapshot*.txt
```

### Step 2: Parse Each Snapshot

For each snapshot file:
1. Read file contents
2. Extract all lines before "COMMAND:" as expected output
3. Extract command from "COMMAND:" line
4. Parse output format (file:line:column[:role])

### Step 3: Run Actual Command

Execute the command:
```bash
cd markdown-ticket
scip-finder [args]  # from COMMAND: line
```

### Step 4: Compare Outputs

Compare expected vs actual:
- **Line count**: Should match
- **Line content**: Should match exactly
- **Order**: Should be identical

### Step 5: Report Results

For each snapshot:
- ✅ PASS: Output matches
- ❌ FAIL: Output differs (show diff)

## Usage

```bash
# Validate all snapshots
claude-code "run snapshot-validator agent"

# Validate specific snapshot
claude-code "validate snapshot_NewTicket.txt"
```

## Output Format

```
Snapshot Validation Results
═══════════════════════════════════════════

snapshot_NewTicket.txt
  Command: scip-finder Ticket --from shared/models/NewTicket.ts
  Status: ✅ PASS
  Expected: 3 lines
  Actual: 3 lines

snapshot_Ticket.txt
  Command: scip-finder Ticket --from shared/models/Ticket.ts
  Status: ❌ FAIL
  Expected: 42 lines
  Actual: 43 lines
  Differences:
    + shared/services/NewService.ts:10:5:
    ^ (unexpected line in actual output)
```

## Error Handling

- Missing snapshot files: Skip with warning
- Invalid COMMAND: line: Report error, continue
- Command execution failure: Report error, mark as FAIL
- File not found (different working dir): Try multiple paths
