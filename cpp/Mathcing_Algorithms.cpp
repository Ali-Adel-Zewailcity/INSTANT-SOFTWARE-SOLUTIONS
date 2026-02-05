#include <iostream>
#include <vector>
#include <cmath>
#include <string>
#include <unordered_map>

using namespace std;


class StringMatching {
protected:
	string text;


	// KMP Algorithm Helper Function
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


	// Rabin-Karp Algorithm (Hashing)
	long long hashing(string chars, int c, long long old_hash = 0) {
		int size = (int)chars.length();
		static int prefix;
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


	unordered_map<char, int> horspoolHelper(string pattern) {
		unordered_map<char, int> values;
		int len = pattern.length();

		for (int i = 0; i < len; i++) {
			if (i == len - 1) {
				if (values.find(char(pattern[i])) == values.end()) {
					values[char(pattern[i])] = len;
					continue;
				}
				else { continue; }
			}
			values[char(pattern[i])] = len - i - 1;
		}

		return values;
	}

public:
	StringMatching(string txt) {
		text = txt;
	}


	vector<int> naiveStringMatching(string pattern) {
		char* ptr_s = &text[0];
		char* ptr_f = &pattern[0];

		vector<int> found_in;

		for (int i = 0; i < text.size(); i++) {
			if (*ptr_s == *ptr_f) {
				if (ptr_f == &pattern[int(pattern.size() - 1)]) {
					found_in.push_back(i - (pattern.size() - 1));
					ptr_s += 1;
					ptr_f = &pattern[0];
				}
				else {
					ptr_s += 1;
					ptr_f += 1;
				}
			}
			else if (*ptr_s != *ptr_f) {
				ptr_s += 1;
				ptr_f = &pattern[0];
			}
		}
		return found_in;
	}



	vector<int> rabinKarp(string pattern) {
		long long pattern_hash = hashing(pattern, 0);
		int pattern_size = pattern.length();
		vector<int> found_in;
		long long word_hash;
		int start = 0;

		do {
			string word = "";
			for (int i = 0; i < pattern_size; i++) {
				word += text[i + start];
			}

			if (!start)
				word_hash = hashing(word, start);
			else word_hash = hashing(word, start, word_hash);

			if (word_hash == pattern_hash) {
				if (word == pattern) {
					found_in.push_back(start);
				}
			}
			start++;
		} while (start <= (text.length() - pattern_size));

		return found_in;
	}


	// KMP Algorithm
	vector<int> searchKMP(string pattern) {
		vector<int> found_in;
		int m = text.length();
		int n = pattern.length();
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


	vector<int> horspool(string pattern) {
		unordered_map<char, int> values = horspoolHelper(pattern);
		vector<int> found_in;

		int i = pattern.length() - 1;

		while (i < text.length()) {
			for (int j = 0; j < pattern.length(); j++) {
				if (pattern[pattern.length() - 1 - j] != text[i - j]) {
					if (values.find(char(text[i])) == values.end())
						i += pattern.length();
					else
						i += values[char(text[i])];
					break;
				}
				if (j == pattern.length() - 1) {
					found_in.push_back(i-j);
					i++;
				}
			}
		}

		return found_in;
	}
};




int main() {
	StringMatching text("Ali Adel Fouad Ali Ahmed");
	vector<int> f = text.horspool("d");

	for (const auto& i : f) {
		cout << i << " ";
	}

	return 0;
}