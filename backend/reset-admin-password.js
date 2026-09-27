import bcrypt from "bcrypt";
import db from "./config/db.js";

const adminEmail = process.argv[2] || "admin@smartcity.com";

const readHiddenPassword = () =>
  new Promise((resolve, reject) => {
    const input = process.stdin;
    const output = process.stdout;

    if (!input.isTTY || typeof input.setRawMode !== "function") {
      reject(new Error("Run this command in an interactive terminal."));
      return;
    }

    let password = "";
    output.write("New admin password (input hidden): ");

    const cleanup = () => {
      input.removeListener("data", onData);
      input.setRawMode(false);
      input.pause();
      output.write("\n");
    };

    const onData = (data) => {
      for (const character of data.toString()) {
        if (character === "\u0003") {
          cleanup();
          reject(new Error("Password reset cancelled."));
          return;
        }

        if (character === "\r" || character === "\n") {
          cleanup();
          resolve(password);
          return;
        }

        if (character === "\u007f" || character === "\b") {
          password = password.slice(0, -1);
          output.write("\b \b");
        } else {
          password += character;
          output.write("*");
        }
      }
    };

    input.setRawMode(true);
    input.resume();
    input.on("data", onData);
  });

try {
  await db.query("SELECT 1");
  const newPassword = await readHiddenPassword();

  if (newPassword.length < 8) {
    throw new Error("Password must be at least 8 characters long.");
  }

  const passwordHash = await bcrypt.hash(newPassword, 10);
  const [result] = await db.query(
    "UPDATE admins SET password_hash = ? WHERE email = ?",
    [passwordHash, adminEmail]
  );

  if (result.affectedRows === 0) {
    throw new Error(`No admin account found for ${adminEmail}.`);
  }

  console.log(`Password reset successfully for ${adminEmail}.`);
} catch (error) {
  console.error(error instanceof Error ? error.message : "Password reset failed.");
  process.exitCode = 1;
} finally {
  await new Promise((resolve, reject) => {
    db.end((error) => (error ? reject(error) : resolve()));
  });
}