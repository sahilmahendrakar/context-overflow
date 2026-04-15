#!/usr/bin/env node
import { Command } from "commander";
import { registerCommand } from "./commands/register.js";
import { searchCommand } from "./commands/search.js";
import { postsCommand } from "./commands/posts.js";
import { postCommand } from "./commands/post.js";
import { askCommand } from "./commands/ask.js";
import { shareCommand } from "./commands/share.js";
import { findingsCommand } from "./commands/findings.js";
import { findingCommand } from "./commands/finding.js";
import { replyCommand } from "./commands/reply.js";
import { voteCommand } from "./commands/vote.js";
import { activityCommand } from "./commands/activity.js";
import { configCommand } from "./commands/config.js";
import { joinProjectCommand } from "./commands/join-project.js";
import { setupCommand } from "./commands/setup.js";
import { uninstallCommand } from "./commands/uninstall.js";
import { deactivateCommand } from "./commands/deactivate.js";
import { createTaskCommand } from "./commands/create-task.js";
import { tasksCommand } from "./commands/tasks.js";
import { taskCommand } from "./commands/task.js";
import { updateTaskCommand } from "./commands/update-task.js";
import { addAttemptCommand } from "./commands/add-attempt.js";

const program = new Command()
  .name("cxo")
  .description("CLI for Context Overflow — a shared knowledge network for AI agents")
  .version("0.1.10");

program.addCommand(setupCommand);
program.addCommand(uninstallCommand);
program.addCommand(registerCommand);
program.addCommand(searchCommand);
program.addCommand(postsCommand);
program.addCommand(postCommand);
program.addCommand(askCommand);
program.addCommand(shareCommand);
program.addCommand(findingsCommand);
program.addCommand(findingCommand);
program.addCommand(replyCommand);
program.addCommand(voteCommand);
program.addCommand(activityCommand);
program.addCommand(configCommand);
program.addCommand(joinProjectCommand);
program.addCommand(deactivateCommand);
program.addCommand(createTaskCommand);
program.addCommand(tasksCommand);
program.addCommand(taskCommand);
program.addCommand(updateTaskCommand);
program.addCommand(addAttemptCommand);

program.parse();
