# Practice Tests

This folder contains practice test data files for different certification exams.

## Adding New Tests

To add a new practice test:

1. **Create the test data file**: Add a new JSON file in this folder (e.g., `aws-developer-c02.json`)

2. **Update tests.json**: Add the test metadata to `tests.json`:

```json
{
  "id": "aws-developer-c02",
  "name": "AWS Developer Associate (DVA-C02)",
  "description": "AWS Certified Developer Associate exam practice questions",
  "category": "AWS",
  "difficulty": "Associate",
  "filename": "aws-developer-c02.json",
  "totalQuestions": 500,
  "timeLimit": 130,
  "passingScore": 72
}
```

## Test Data Format

Each test data file should follow this structure:

```json
{
  "exam_id": 123,
  "total_questions": 100,
  "questions": [
    {
      "question_id": "unique_id",
      "question_number": 1,
      "question_text": "Question text here",
      "choices": {
        "A": "Choice A text",
        "B": "Choice B text",
        "C": "Choice C text",
        "D": "Choice D text"
      },
      "correct_answer": "B",
      "is_multiple_choice": false,
      "question_images": [],
      "answer_images": []
    }
  ]
}
```

## Image Support

- Use `//IMG//` placeholders in question text where images should appear
- Add image URLs to `question_images` array for question images
- Add image URLs to `answer_images` array for answer choice images

## Multiple Choice Questions

For questions with multiple correct answers:
- Set `"is_multiple_choice": true`
- Set `"correct_answer": "AB"` (for choices A and B)

## Current Tests

- **AWS SAA-C03**: AWS Solutions Architect Associate (1019 questions)
- **AWS CLF-C01**: AWS Cloud Practitioner (50 sample questions)