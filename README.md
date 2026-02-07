# TRIGGER SENSE - String Matching Algorithms

A comprehensive web-based application designed to demonstrate, test, and apply various string matching algorithms. This project showcases the practical implementation of algorithms like Naive, Knuth-Morris-Pratt (KMP), Rabin-Karp, and Boyer-Moore-Horspool in real-world scenarios such as text search, movie database querying, and sentiment analysis.

## Features

### 1. Algorithm Tester
Test and compare different string matching algorithms on custom text files.
- **Upload Text Files:** Users can upload .txt files to search within.
- **Algorithm Selection:** Choose between Naive, KMP, Rabin-Karp (Hashing), and Horspool algorithms.
- **Performance Metrics:** View processing time and the number of matches found.
- **Visualization:** See the exact positions (line and column) of the matches within the text.

### 2. Movie Search Engine
A search engine powered by the KMP algorithm to find movies efficiently.
- **Instant Search:** Search for movies by title.
- **Detailed Information:** Displays movie details including release date, popularity, rating, genres, sequels, and cast.
- **KMP Implementation:** Utilizes the Knuth-Morris-Pratt algorithm for fast and accurate string matching.

### 3. Sentiment Analysis
An application of string matching algorithms to analyze the sentiment of a given text.
- **Text Analysis:** Enter text to detect emotional tones.
- **Keyword Detection:** Identifies keywords related to various emotions (e.g., anger, sadness, stress, anxiety) using the selected string matching algorithm.
- **Scoring System:** Calculates positive, negative, and neutral scores based on keyword density and weights.
- **Visual Feedback:** Highlights detected keywords in the text with color-coded indicators.

## Algorithms Implemented

The project implements the following string matching algorithms in JavaScript (ported from C++):

1.  **Naive String Matching:** Checks for the pattern at all possible positions in the text.
2.  **Knuth-Morris-Pratt (KMP):** Improves the worst-case performance by using the information from previous matches (Longest Proper Prefix which is also Suffix).
3.  **Rabin-Karp (Hashing):** Uses hashing to find any one of a set of pattern strings in a text.
4.  **Boyer-Moore-Horspool:** An efficient algorithm that skips characters based on a bad-character shift table.

## Technologies Used

-   **Frontend:** HTML5, CSS3, JavaScript (ES6+)
-   **Styling:** Bootstrap 5, Custom CSS
-   **Backend Logic:** implemented in JavaScript (Client-side)
-   **Reference:** C++ implementations available in the cpp/ directory.

## File Structure

-   `index.html`: Main page for the Algorithm Tester.
-   `search.html`: Page for the Movie Search Engine.
-   `sentiment.html`: Page for the Sentiment Analysis tool.
-   `js/`: Contains JavaScript files (`script.js`, `search.js`, `sentiment.js`, `movie_data.js`, `data.json`).
-   `css/`: Contains CSS stylesheets (`styles.css`, `search.css`).
-   `cpp/`: Contains C++ source code for the algorithms (`Mathcing_Algorithms.cpp`).
-   `images/`: Contains images and assets.

## How to Run

1.  Clone or download the repository.
2.  Open `index.html` in a modern web browser.
3.  Navigate between the different tools using the navigation bar.

Note: For the best experience, especially with file uploads and data loading, it is recommended to run the project using a local web server (e.g., Live Server in VS Code or Python's `http.server`).

## C++ Implementation

The `cpp/Mathcing_Algorithms.cpp` file contains the reference implementations of the string matching algorithms in C++. This serves as the logic basis for the JavaScript ports used in the web application.
