# Chemistry Quiz Application

This Node.js application runs a timed chemistry quiz based on a set of predefined questions stored in a JSON file.

## Features

- Randomly selects 10 questions from a pool of chemistry questions generated from the [chemistry Gaia node](https://chemistry.us.gaianet.network)
- ![image](https://github.com/user-attachments/assets/2e9f7bee-35a6-409c-906a-c6e991f9d0ca)
- 10-second timer for each question
- 5 points awarded for correct answers, 0 for incorrect answers
- No ability to return to previous questions
- Displays total score at the end of the quiz

## Prerequisites

- Node.js installed on your system
- `quiz_data.json` file in the same directory as the script

## Setup

1. Save the provided JavaScript code in a file named `index.js`.
2. Ensure `quiz_data.json` is in the same directory as `index.js`.

## Running the Application

Run the following command in your terminal:

```
node index.js
```

## Code Structure

The application is structured as follows:

1. **Importing Required Modules**:
   - `readline` for handling user input
   - `fs` for reading the JSON file

2. **Data Loading and Preparation**:
   - Reads and parses the `quiz_data.json` file
   - Shuffles the questions randomly using the `shuffleArray` function

3. **Quiz Logic**:
   - `askQuestion()`: Main function that handles asking questions, timing, and scoring
   - `endQuiz()`: Displays the final score and closes the readline interface

4. **User Interaction**:
   - Uses readline to get user input for answers
   - Provides immediate feedback on correct/incorrect answers

5. **Timing Mechanism**:
   - Uses `setInterval` to create a 10-second countdown for each question

## Key Functions

- `shuffleArray(array)`: Randomizes the order of elements in an array
- `askQuestion()`: Manages the flow of the quiz, including displaying questions, handling user input, and timing
- `endQuiz()`: Concludes the quiz and displays the final score

## Quiz Flow

1. The application starts by welcoming the user and explaining the rules.
2. For each question:
   - The question and options are displayed.
   - A 10-second timer starts.
   - The user can input their answer (1-4).
   - If the timer expires before an answer is given, the quiz moves to the next question.
   - Immediate feedback is provided for each answer.
3. After all questions are answered or timed out, the total score is displayed.

## Customization

To modify the quiz questions or add more, edit the `quiz_data.json` file. Ensure each question object has:
- A `question` field (string)
- An `options` field (array of strings)
- A `correctAnswer` field (string matching one of the options)

## Limitations & Next Steps

- Console-based interface
- No persistence of scores between runs
- Fixed number of questions and time per question
