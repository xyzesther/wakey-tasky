const {
  TaskValidationError,
  parseAndValidateTasks
} = require('../taskParser');

describe('parseAndValidateTasks', () => {
  test('parses fenced JSON and derives the main duration from subtasks', () => {
    const tasks = parseAndValidateTasks(`\`\`\`json
      {
        "tasks": [{
          "title": "Prepare interview",
          "status": "PENDING",
          "duration": 999,
          "subtasks": [
            {"title": "Review company", "status": "PENDING", "duration": 25},
            {"title": "Practice answers", "status": "PENDING", "duration": 35}
          ]
        }]
      }
    \`\`\``);

    expect(tasks).toHaveLength(1);
    expect(tasks[0].duration).toBe(60);
    expect(tasks[0].subtasks[0].description).toBeNull();
  });

  test('accepts the legacy top-level array format', () => {
    const tasks = parseAndValidateTasks(
      '[{"title":"Email recruiter","duration":5,"subtasks":[]}]'
    );

    expect(tasks[0]).toMatchObject({
      title: 'Email recruiter',
      duration: 5,
      status: 'PENDING'
    });
  });

  test('rejects unsupported statuses', () => {
    expect(() =>
      parseAndValidateTasks(
        '{"tasks":[{"title":"Test","duration":5,"status":"DONE"}]}'
      )
    ).toThrow(TaskValidationError);
  });

  test('rejects malformed JSON instead of passing it to persistence', () => {
    expect(() => parseAndValidateTasks('not json')).toThrow(
      'AI response is not valid JSON'
    );
  });
});
