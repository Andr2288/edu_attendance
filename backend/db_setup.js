const fs = require('fs');
const path = require('path');
const readline = require('readline');
const mysql = require('mysql2/promise');
const {
  DB_HOST,
  DB_PORT,
  DB_USER,
  DB_PASSWORD,
  DB_NAME,
  TABLES,
} = require('./config/db.constants');

const SQL_DIR = path.join(__dirname, 'sql');
const CREATE_SQL_PATH = path.join(SQL_DIR, 'create.sql');
const SEED_SQL_PATH = path.join(SQL_DIR, 'seed.sql');

function createRl() {
  return readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
}

function ask(rl, question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => resolve(String(answer).trim()));
  });
}

function readSqlFile(filePath) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`SQL-файл не знайдено: ${filePath}`);
  }
  return fs.readFileSync(filePath, 'utf8');
}

async function createServerConnection() {
  return mysql.createConnection({
    host: DB_HOST,
    port: DB_PORT,
    user: DB_USER,
    password: DB_PASSWORD,
    multipleStatements: true,
  });
}

async function createDbConnection() {
  return mysql.createConnection({
    host: DB_HOST,
    port: DB_PORT,
    user: DB_USER,
    password: DB_PASSWORD,
    database: DB_NAME,
    multipleStatements: true,
  });
}

async function databaseExists(connection) {
  const [rows] = await connection.query(
    'SELECT SCHEMA_NAME FROM INFORMATION_SCHEMA.SCHEMATA WHERE SCHEMA_NAME = ?',
    [DB_NAME]
  );
  return rows.length > 0;
}

async function getExistingTables(connection) {
  const [rows] = await connection.query(
    `SELECT TABLE_NAME AS name
     FROM INFORMATION_SCHEMA.TABLES
     WHERE TABLE_SCHEMA = ?`,
    [DB_NAME]
  );
  return rows.map((row) => row.name);
}

async function getTableRowCount(connection, tableName) {
  const [rows] = await connection.query(
    `SELECT COUNT(*) AS count FROM \`${tableName}\``
  );
  return Number(rows[0].count);
}

async function checkDatabaseStatus() {
  console.log('\n=== Перевірка стану бази даних ===');
  console.log(`Хост: ${DB_HOST}:${DB_PORT}`);
  console.log(`Користувач: ${DB_USER}`);
  console.log(`База: ${DB_NAME}`);

  let connection;
  try {
    connection = await createServerConnection();
    console.log('Підключення до MySQL: OK');
  } catch (error) {
    console.error('Підключення до MySQL: ПОМИЛКА');
    console.error(
      'Переконайтесь, що XAMPP запущено і MySQL активний.'
    );
    console.error(error.message);
    return;
  }

  try {
    const exists = await databaseExists(connection);
    if (!exists) {
      console.log(`База даних "${DB_NAME}" не існує.`);
      console.log('Оберіть пункт 2, щоб ініціалізувати базу.');
      return;
    }

    console.log(`База даних "${DB_NAME}": існує`);
    await connection.changeUser({ database: DB_NAME });

    const existingTables = await getExistingTables(connection);
    console.log(`Знайдено таблиць: ${existingTables.length}`);

    for (const tableName of TABLES) {
      if (!existingTables.includes(tableName)) {
        console.log(`  - ${tableName}: відсутня`);
        continue;
      }
      const count = await getTableRowCount(connection, tableName);
      console.log(`  - ${tableName}: OK (${count} записів)`);
    }

    const unexpected = existingTables.filter(
      (name) => !TABLES.includes(name)
    );
    if (unexpected.length > 0) {
      console.log(`Інші таблиці: ${unexpected.join(', ')}`);
    }
  } finally {
    await connection.end();
  }
}

async function runSqlFile(connection, filePath, label) {
  const sql = readSqlFile(filePath);
  console.log(`Виконую ${label}: ${path.basename(filePath)}`);
  await connection.query(sql);
}

async function initializeDatabase({ force = false } = {}) {
  console.log(
    force
      ? '\n=== Перевстановлення бази даних ==='
      : '\n=== Ініціалізація бази даних ==='
  );

  let connection;
  try {
    connection = await createServerConnection();
  } catch (error) {
    console.error('Не вдалося підключитися до MySQL.');
    console.error(error.message);
    return;
  }

  try {
    const exists = await databaseExists(connection);

    if (exists && !force) {
      await connection.changeUser({ database: DB_NAME });
      const existingTables = await getExistingTables(connection);
      const hasExpectedTables = TABLES.every((name) =>
        existingTables.includes(name)
      );

      if (hasExpectedTables) {
        console.log(
          `База "${DB_NAME}" уже ініціалізована. Нічого не змінено.`
        );
        console.log(
          'Для повного перевстановлення оберіть пункт 3.'
        );
        return;
      }

      console.log(
        `База "${DB_NAME}" існує, але схема неповна. Оновлюю таблиці та сід.`
      );
    }

    if (force && exists) {
      console.log(`Видаляю базу "${DB_NAME}"...`);
      await connection.query(`DROP DATABASE \`${DB_NAME}\``);
    }

    console.log(`Створюю базу "${DB_NAME}"...`);
    await connection.query(
      `CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
    );
    await connection.changeUser({ database: DB_NAME });

    await runSqlFile(connection, CREATE_SQL_PATH, 'створення таблиць');
    await runSqlFile(connection, SEED_SQL_PATH, 'сід даних');

    console.log('Готово.');
    console.log('Тестовий пароль усіх користувачів: password123');
  } catch (error) {
    console.error('Помилка ініціалізації:');
    console.error(error.message);
  } finally {
    await connection.end();
  }
}

async function reinstallDatabase(rl) {
  console.log('\nУВАГА: база буде повністю видалена.');
  const answer = await ask(
    rl,
    `Введіть назву бази "${DB_NAME}" для підтвердження: `
  );

  if (answer !== DB_NAME) {
    console.log('Скасовано: назва не збігається.');
    return;
  }

  await initializeDatabase({ force: true });
}

function printMenu() {
  console.log('\n==============================');
  console.log('  Налаштування бази даних');
  console.log('==============================');
  console.log(`  База: ${DB_NAME} @ ${DB_HOST}:${DB_PORT}`);
  console.log('------------------------------');
  console.log('  1. Перевірити стан бази даних');
  console.log('  2. Ініціалізувати базу даних');
  console.log('  3. Перевстановити базу даних');
  console.log('  0. Вихід');
  console.log('==============================');
}

async function main() {
  const rl = createRl();

  try {
    while (true) {
      printMenu();
      const choice = await ask(rl, 'Ваш вибір: ');

      if (choice === '1') {
        await checkDatabaseStatus();
      } else if (choice === '2') {
        await initializeDatabase({ force: false });
      } else if (choice === '3') {
        await reinstallDatabase(rl);
      } else if (choice === '0') {
        console.log('Вихід.');
        break;
      } else {
        console.log('Невідомий пункт меню. Спробуйте ще раз.');
      }
    }
  } finally {
    rl.close();
  }
}

main().catch((error) => {
  console.error('Критична помилка:', error.message);
  process.exit(1);
});
