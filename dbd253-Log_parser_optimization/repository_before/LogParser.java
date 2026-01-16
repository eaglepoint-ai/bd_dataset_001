package com.logparser;

import java.util.ArrayList;
import java.util.List;

public class LogParser {
    // Original unoptimized logic as per prompt
    public static List<String> parseLogs(List<String> lines) {
        List<String> errors = new ArrayList<>();
        for (String line : lines) {
            String[] parts = line.split(" ");
            for (String p : parts) {
                if (p.contains("ERROR")) {
                    errors.add(line);
                }
            }
        }
        return errors;
    }
}
