# AWS Solutions Architect Associate Practice App

A React-based practice application for AWS Solutions Architect Associate exam questions.

## Features

- **Interactive Quiz Interface**: Clean, modern UI for answering questions
- **Multiple Answer Support**: Handles both single and multiple-choice questions
- **Real-time Feedback**: Immediate feedback with correct/incorrect highlighting
- **Progress Tracking**: Shows current progress, accuracy, and score
- **Color-coded Results**: 
  - Green highlighting for correct answers
  - Red highlighting for incorrect selections
  - Automatic highlighting of correct answers when wrong
- **Smart Question Handling**:
  - Single choice: Click to submit automatically
  - Multiple choice: Select multiple answers and click Submit button

## How to Use

1. **Starting the Quiz**: The app loads automatically with the first question
2. **Single Choice Questions**: Simply click on your answer choice - it submits automatically
3. **Multiple Choice Questions**: 
   - Look for the "Multiple Answers" indicator
   - Select multiple answers by clicking on them
   - Click the "Submit Answer" button when ready
4. **After Answering**: 
   - See immediate feedback (correct/incorrect)
   - View the correct answer
   - Click "Next Question" to continue
5. **Progress**: Track your progress and accuracy in the header
6. **Restart**: Click "Restart Quiz" to start over

## Installation & Running

```bash
# Install dependencies
npm install

# Start development server
npm start

# Build for production
npm run build
```

## Data Source

The app uses AWS Solutions Architect Associate exam questions from the included `data.json` file.

## Technologies Used

- React 18 with TypeScript
- CSS3 for styling
- Responsive design for various screen sizes