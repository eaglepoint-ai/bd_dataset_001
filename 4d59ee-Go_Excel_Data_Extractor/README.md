# Go Excel Data Extractor

## Problem Statement
Build a Go command-line tool that extracts data from Excel files (.xlsx) and outputs structured JSON. The tool must handle Excel-specific quirks like dates stored as serial numbers, mixed data types, and empty cells. Create the complete project structure including the main package, Excel reader logic using the excelize library, and proper error handling.

## Prompt
Create a complete Go application from scratch that reads Excel files and converts them to JSON. Use the excelize library for Excel parsing. The tool should accept a file path and sheet name as arguments, automatically detect column headers from the first row, convert Excel serial dates to ISO 8601 format, preserve data types (numbers, booleans, strings), and handle empty cells as null values in JSON output.

## Requirements
1. Create a complete Go module with proper `go.mod` file using excelize library (github.com/xuri/excelize/v2)
2. Implement a CLI that accepts: `./extractor <file.xlsx> <sheet_name>` and outputs JSON to stdout
3. Read column headers from row 1 and use them as JSON keys for each data row
4. Convert Excel serial date numbers to ISO 8601 format (Excel epoch is December 30, 1899)
5. Auto-detect cell types: numbers as float64, booleans as bool, dates as ISO string, text as string, empty as null
6. Handle errors gracefully: file not found, sheet not found, invalid Excel format - print error to stderr with exit code 1
7. Output pretty-printed JSON array to stdout on success

## Category
New Feature Development

## Example Input (data.xlsx, Sheet1)
| Name  | Age | JoinDate | Salary   | Active |
|-------|-----|----------|----------|--------|
| Alice | 30  | 44927    | 75000.50 | TRUE   |
| Bob   | 25  | 45000    |          | FALSE  |

## Example Output
```json
[
  {
    "Name": "Alice",
    "Age": 30,
    "JoinDate": "2023-01-01T00:00:00Z",
    "Salary": 75000.5,
    "Active": true
  },
  {
    "Name": "Bob",
    "Age": 25,
    "JoinDate": "2023-03-15T00:00:00Z",
    "Salary": null,
    "Active": false
  }
]
```

## Notes
- Excel stores dates as serial numbers (days since December 30, 1899)
- Empty cells should be null in JSON, not empty strings
- Use the excelize library (github.com/xuri/excelize/v2)

## Commands
```bash
docker-compose run --rm run_before
```

