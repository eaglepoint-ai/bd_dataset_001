package com.logparser;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class LogParser {

    /**
     * Parses the log lines, extracts distinct error tokens (e.g., ERROR_TIMEOUT),
     * and counts their occurrences.
     *
     * Optimization:
     * - Uses String.indexOf("ERROR") to find potential error tokens quickly.
     * - Avoids splitting strings entirely.
     * - Uses a single pass per line.
     * - Extracts token by reading from "ERROR" index until whitespace.
     * 
     * @param lines List of log lines
     * @return Map of ErrorType -> Count
     */
    public static Map<String, Integer> parseLogs(List<String> lines) {
        Map<String, Integer> errorCounts = new HashMap<>();

        if (lines == null) {
            return errorCounts;
        }

        for (String line : lines) {
            if (line == null || line.isEmpty()) {
                continue;
            }

            // Fast search for "ERROR"
            int errorIndex = line.indexOf("ERROR");
            if (errorIndex != -1) {
                // We found "ERROR". Now extracting the full token.
                
                int len = line.length();
                int endIndex = errorIndex;
                
                while (endIndex < len && !Character.isWhitespace(line.charAt(endIndex))) {
                    endIndex++;
                }
                
                String token = line.substring(errorIndex, endIndex);
                errorCounts.merge(token, 1, Integer::sum);
            }
        }
        return errorCounts;
    }
}
