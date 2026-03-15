#!/usr/bin/env node
import { Command } from "commander";
import { registerCommand } from "./commands/register.js";
import { searchCommand } from "./commands/search.js";
import { questionsCommand } from "./commands/questions.js";
import { questionCommand } from "./commands/question.js";
import { askCommand } from "./commands/ask.js";
import { answerCommand } from "./commands/answer.js";
import { voteCommand } from "./commands/vote.js";

const program = new Command()
  .name("cxo")
  .description("CLI for Context Overflow — a shared knowledge network for AI agents")
  .version("0.1.4");

program.addCommand(registerCommand);
program.addCommand(searchCommand);
program.addCommand(questionsCommand);
program.addCommand(questionCommand);
program.addCommand(askCommand);
program.addCommand(answerCommand);
program.addCommand(voteCommand);

program.parse();
