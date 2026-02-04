#include "crow_all.h" // Ensure this is " " not < >
#include <iostream>
#include <vector>
#include <cmath>
#include <string>
#include <sstream>

using namespace std;

// --- Your Algorithm Class (Integrated & Thread-Safe) ---
class StringMatching {
protected:
    string text;

    // KMP Helper
    vector<int> computeLPS(string pattern) {
        int i = 1, len = 0, m = pattern.length();
        vector<int> lps(m, 0);

        while (i < m) {
            if (pattern[i] == pattern[len]) {
                len++;
                lps[i] = len;
                i++;
            }
            else {
                if (len != 0) {
                    len = lps[len - 1];
                }
                else {
                    lps[i] = 0;
                    i++;
                }
            }
        }
        return lps;
    }

public:
    StringMatching(string txt) {
        text = txt;
    }

    // 1. Naive Algorithm
    vector<int> naiveStringMatching(string pattern) {
        if (pattern.empty() || text.empty()) return {};
        
        char* ptr_s = &text[0];
        char* ptr_f = &pattern[0];
        vector<int> found_in;

        // Added boundary check to prevent reading past end
        for (int i = 0; i < text.size(); i++) {
            // Safety check for remaining length
            if (i + pattern.size() > text.size()) break; 

            bool match = true;
            for(int j=0; j<pattern.size(); j++) {
                if(text[i+j] != pattern[j]) {
                    match = false;
                    break;
                }
            }
            if(match) {
                found_in.push_back(i);
            }
        }
        return found_in;
    }

    // 2. Rabin-Karp (Hashing) - Modified for Thread Safety
    // We pass 'prefix' by reference instead of using 'static'
    long long hashing(string chars, int c, long long old_hash, int& prefix) {
        int size = (int)chars.length();
        long long hash = 0;
        if (c == 0) {
            prefix = int(char(chars[0])) * pow(101, size - 1);
            hash += prefix;
            for (int i = 2; i <= size; i++) {
                hash += int(char(chars[i - 1])) * pow(101, size - i);
            }
        }
        else {
            hash = (101 * (old_hash - prefix)) + int(char(chars[size - 1]));
            prefix = int(char(chars[0])) * pow(101, size - 1);
        }
        return hash;
    }

    vector<int> rabinKarp(string pattern) {
        if (pattern.size() > text.size()) return {};

        int prefix = 0; // Local variable instead of static
        long long pattern_hash = hashing(pattern, 0, 0, prefix);
        int pattern_size = pattern.length();
        vector<int> found_in;
        long long word_hash = 0;
        int start = 0;

        // Reset prefix for the word calculation
        int word_prefix = 0; 

        do {
            string word = "";
            // Construct window
            if (start + pattern_size > text.length()) break;
            
            // Optimization: In real RK we don't reconstruct string, but for this project it's fine
            for (int i = 0; i < pattern_size; i++) {
                word += text[i + start];
            }

            if (start == 0)
                word_hash = hashing(word, 0, 0, word_prefix);
            else 
                word_hash = hashing(word, start, word_hash, word_prefix);

            if (word_hash == pattern_hash) {
                if (word == pattern) {
                    found_in.push_back(start);
                }
            }
            start++;
        } while (start <= (text.length() - pattern_size));

        return found_in;
    }

    // 3. KMP Algorithm
    vector<int> searchKMP(string pattern) {
        vector<int> found_in;
        int m = text.length();
        int n = pattern.length();
        if (n == 0) return {};
        
        vector<int> lps = computeLPS(pattern);
        int i = 0, j = 0;

        while (i < m) {
            if (text[i] == pattern[j]) {
                i++;
                j++;
            }

            if (j == n) {
                found_in.push_back(i - j);
                j = lps[j - 1];
            }
            else if (i < m && text[i] != pattern[j]) {
                if (j != 0) {
                    j = lps[j - 1];
                }
                else {
                    i++;
                }
            }
        }
        return found_in;
    }
};

// --- Helper to convert Index -> Row/Col ---
struct MatchResult {
    int row;
    int col;
};

// This function scans the text to find which line/col the index belongs to
MatchResult getRowCol(const string& text, int index) {
    int row = 1;
    int col = 1;
    for (int i = 0; i < index; i++) {
        if (text[i] == '\n') {
            row++;
            col = 1;
        } else {
            col++;
        }
    }
    return {row, col};
}

// --- Main API Server ---
int main() {
    crow::SimpleApp app;

    // Enable CORS (Allows your HTML page to talk to this C++ app)
    CROW_ROUTE(app, "/search")
    .methods("OPTIONS"_method)
    ([](const crow::request& req) {
        auto response = crow::response(200);
        response.add_header("Access-Control-Allow-Origin", "*");
        response.add_header("Access-Control-Allow-Methods", "POST, OPTIONS");
        response.add_header("Access-Control-Allow-Headers", "Content-Type");
        return response;
    });

    // The Search Logic
    CROW_ROUTE(app, "/search")
    .methods("POST"_method)
    ([](const crow::request& req) {
        auto x = crow::json::load(req.body);
        if (!x) return crow::response(400, "Invalid JSON");

        string text = x["text"].s();
        string pattern = x["pattern"].s();
        string algo = x["algorithm"].s();

        StringMatching solver(text);
        vector<int> indices;

        // Select Algorithm
        if (algo == "naive") {
            indices = solver.naiveStringMatching(pattern);
        } else if (algo == "kmp") {
            indices = solver.searchKMP(pattern);
        } else if (algo == "hashing") {
            indices = solver.rabinKarp(pattern);
        } else {
            // Default to Naive if "horspool" (since it's not in your cpp yet)
            // Or you can add your Horspool function to the class above
            indices = solver.naiveStringMatching(pattern);
        }

        // Convert Indices to Row/Col for the website
        crow::json::wvalue responseJson;
        for (int i = 0; i < indices.size(); ++i) {
            MatchResult loc = getRowCol(text, indices[i]);
            responseJson["matches"][i]["row"] = loc.row;
            responseJson["matches"][i]["col"] = loc.col;
        }

        // If no matches, ensure we send an empty list
        if (indices.empty()) {
            responseJson["matches"] = std::vector<string>(); 
        }

        auto response = crow::response(responseJson);
        response.add_header("Access-Control-Allow-Origin", "*");
        return response;
    });

    cout << "Starting Server on port 8080..." << endl;
    app.port(8080).multithreaded().run();
}