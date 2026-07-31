jest.mock('../models/openai', () => ({
  chat: jest.fn()
}));

const { chat } = require('../models/openai');
const { generateTasksFromText } = require('../taskGenerator');

describe('generateTasksFromText', () => {
  beforeEach(() => {
    chat.mockReset();
  });

  test('repairs and validates one malformed model response', async () => {
    chat
      .mockResolvedValueOnce('This is not JSON')
      .mockResolvedValueOnce(
        '{"tasks":[{"title":"Write proposal","duration":5,"subtasks":[]}]}'
      );

    const tasks = await generateTasksFromText('Write a proposal');

    expect(chat).toHaveBeenCalledTimes(2);
    expect(tasks[0].title).toBe('Write proposal');
  });

  test('does not retry a valid response', async () => {
    chat.mockResolvedValueOnce(
      '{"tasks":[{"title":"Read brief","duration":10,"subtasks":[]}]}'
    );

    await generateTasksFromText('Read the brief');

    expect(chat).toHaveBeenCalledTimes(1);
  });
});
