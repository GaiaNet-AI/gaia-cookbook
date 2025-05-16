/**
 * Chemistry Quiz Application
 * 
 * This Node.js application runs a timed chemistry quiz based on questions stored in a JSON file.
 * Data is generated from https://chemistry.us.gaianet.network
 * Features:
 * - Randomly selects questions from a pool
 * - 15-second timer for each question
 * - 5 points for correct answers, 0 for incorrect
 * - No returning to previous questions
 * - Displays total score at the end
 * 
 * Prerequisites:
 * - Node.js installed
 * - quiz_data.json file in the same directory
 * 
 * Run the application with: node index.js
 */

const readline = require('readline');
const fs = require('fs');

// Read and parse the JSON file containing quiz questions
const quizData = JSON.parse(fs.readFileSync('quiz_data.json', 'utf8'));

/**
 * Shuffles the elements of an array randomly
 * @param {Array} array - The array to be shuffled
 */
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

// Shuffle the questions to randomize the quiz
shuffleArray(quizData.questions);

// Set up readline interface for user input
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

let currentQuestionIndex = 0;
let score = 0;

/**
 * Main function to handle asking questions, timing, and scoring
 */
function askQuestion() {
    if (currentQuestionIndex >= quizData.questions.length) {
        endQuiz();
        return;
    }

    const question = quizData.questions[currentQuestionIndex];
    console.log(`\nQuestion ${currentQuestionIndex + 1}: ${question.question}`);
    question.options.forEach((option, index) => {
        console.log(`${index + 1}. ${option}`);
    });

    // Set up 15-second timer for each question
    let timeLeft = 15;
    const timer = setInterval(() => {
        process.stdout.write(`\rTime left: ${timeLeft} seconds`);
        timeLeft--;
        if (timeLeft < 0) {
            clearInterval(timer);
            console.log('\nTime\'s up!');
            currentQuestionIndex++;
            askQuestion();
        }
    }, 1000);

    // Handle user input for answers
    rl.question('Your answer (1-4): ', (answer) => {
        clearInterval(timer);
        const selectedAnswer = question.options[parseInt(answer) - 1];
        if (selectedAnswer === question.correctAnswer) {
            console.log('Correct! +5 points');
            score += 5;
        } else {
            console.log(`Wrong! The correct answer was: ${question.correctAnswer}`);
        }
        currentQuestionIndex++;
        if (currentQuestionIndex < quizData.questions.length) {
            askQuestion();
        } else {
            endQuiz();
        }
    });
}

/**
 * Concludes the quiz and displays the final score
 */
function endQuiz() {
    console.log(`\nQuiz completed! Your total score is: ${score} out of 50`);
    rl.close();
}

// Start the quiz
console.log('Welcome to the Chemistry Quiz!');
console.log('You have 10 seconds to answer each question.');
console.log('Each correct answer is worth 5 points.');
askQuestion();