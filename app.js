const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");
const app = express();
app.use(express.json());
const format = require("date-fns/format");
var isValid = require("date-fns/isValid");

const dbPath = path.join(__dirname, "todoApplication.db");
let db = null;

const initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};

initializeDbAndServer();

const convertDbResponseToCc = (eachTodo) => {
  return {
    id: eachTodo.id,
    todo: eachTodo.todo,
    priority: eachTodo.priority,
    status: eachTodo.status,
    category: eachTodo.category,
    dueDate: eachTodo.due_date,
  };
};

const hasPriorityAndStatusProperties = (requestQuery) => {
  return (
    requestQuery.priority !== undefined && requestQuery.status !== undefined
  );
};

const hasPriorityAndCategoryProperties = (requestQuery) => {
  return (
    requestQuery.priority !== undefined && requestQuery.category !== undefined
  );
};

const hasCategoryAndStatusProperties = (requestQuery) => {
  return (
    requestQuery.category !== undefined && requestQuery.status !== undefined
  );
};

const hasPriorityProperty = (requestQuery) => {
  return requestQuery.priority !== undefined;
};

const hasStatusProperty = (requestQuery) => {
  return requestQuery.status !== undefined;
};

const hasCategoryProperty = (requestQuery) => {
  return requestQuery.category !== undefined;
};

const isStatusValid = (status) => {
  return status === "TO DO" || status === "IN PROGRESS" || status === "DONE";
};

const isPriorityValid = (priority) => {
  return priority === "HIGH" || priority === "MEDIUM" || priority === "LOW";
};

const isCategoryValid = (category) => {
  return category === "WORK" || category === "HOME" || category === "LEARNING";
};

//API for Returns a list of all todos
app.get("/todos/", async (request, response) => {
  const { search_q = "", status, priority, category } = request.query;
  let data = null;
  let getTodosQuery = "";

  switch (true) {
    case hasStatusProperty(request.query):
      switch (false) {
        case isStatusValid(status):
          response.status(400);
          response.send("Invalid Todo Status");
          break;

        default:
          getTodosQuery = ` 
      SELECT 
        *
      FROM
        todo
      WHERE
        todo LIKE '%${search_q}%' and status = '${status}'; 
      `;
          break;
      }

      break;

    case hasCategoryProperty(request.query):
      switch (false) {
        case isCategoryValid(category):
          response.status(400);
          response.send("Invalid Todo Category");
          break;

        default:
          getTodosQuery = `
                SELECT 
                    *
                FROM
                    todo
                WHERE
                    todo LIKE '%${search_q}%' and category = '${category}'; 
                `;
          break;
      }

      break;

    case hasCategoryAndStatusProperties(request.query):
      switch (false) {
        case isCategoryValid(category):
          response.status(400);
          response.send("Invalid Todo Category");
          break;
        case isStatusValid(status):
          response.status(400);
          response.send("Invalid Todo Status");
          break;
        default:
          getTodosQuery = `
            SELECT 
                *
            FROM
                todo
            WHERE
                 category = '${category}'
                AND status = '${status}'; 
            `;
          break;
      }

      break;

    case hasPriorityAndCategoryProperties(request.query):
      switch (false) {
        case isCategoryValid(category):
          response.status(400);
          response.send("Invalid Todo Category");
          break;
        case isPriorityValid(priority):
          response.status(400);
          response.send("Invalid Todo Priority");
          break;
        default:
          getTodosQuery = `
                    SELECT 
                        *
                    FROM
                        todo
                    WHERE
                        todo LIKE '%${search_q}%'
                        AND priority = '${status}'
                        AND category = '${category}'; 
                    `;
          break;
      }

      break;

    case hasPriorityProperty(request.query):
      switch (false) {
        case isPriorityValid(priority):
          response.status(400);
          response.send("Invalid Todo Priority");
          break;

        default:
          getTodosQuery = `
                SELECT 
                    *
                FROM
                    todo
                WHERE
                    todo LIKE '%${search_q}%' and priority = '${priority}'; 
                `;
          break;
      }

      break;
    case hasPriorityAndStatusProperties(request.query):
      switch (false) {
        case isPriorityValid(priority):
          response.status(400);
          response.send("Invalid Todo Priority");
          break;
        case isStatusValid(category):
          response.status(400);
          response.send("Invalid Todo Status");
          break;
        default:
          getTodosQuery = `
            SELECT 
                *
            FROM
                todo
            WHERE
            todo LIKE '%${search_q}%'
            AND status = '${status}'
            AND priority = '${priority}';`;
          break;
      }

      break;

    default:
      getTodosQuery = `
      SELECT 
        *
      FROM
        todo
      WHERE
        todo LIKE '%${search_q}%'; 
      `;
      break;
  }

  data = await db.all(getTodosQuery);
  response.send(data);
});

//API for Returns a specific todo based on the todo ID
app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;

  const getTodoQuery = `
  SELECT
    *
  FROM
    todo
    WHERE
        id = ${todoId};
  `;

  const todoItem = await db.get(getTodoQuery);
  response.send(convertDbResponseToCc(todoItem));
});

//Returns a list of all todos with a specific due date in the query parameter
app.get("/agenda/", async (request, response) => {
  const { date } = request.query;
  const newDate = format(new Date(date), "yyyy-MM-dd");

  switch (false) {
    case isValid(new Date(date)):
      response.status(400);
      response.send("Invalid Due Date");
      break;
    default:
      const getTodoQuery = `
         SELECT 
        *
      FROM
        todo
      WHERE
        due_date = '${date}';
        `;

      const data = await db.all(getTodoQuery);
      response.send(data);

      break;
  }
});

//API for Create a todo in the todo table
app.post("/todos/", async (request, response) => {
  const { id, todo, priority, status, category, dueDate } = request.body;
  let result = null;

  switch (false) {
    case isPriorityValid(priority):
      response.status(400);
      response.send("Invalid Todo Priority");
      break;

    case isStatusValid(status):
      response.status(400);
      response.send("Invalid Todo Status");
      break;

    case isCategoryValid(category):
      response.status(400);
      response.send("Invalid Todo Category");
      break;
    case isValid(new Date(dueDate)):
      response.status(400);
      response.send("Invalid Due Date");
      break;
    default:
      const newDate = format(new Date(dueDate), "yyyy-MM-dd");
      const createTodoQuery = `
            INSERT INTO todo
                (id, todo, category, priority, status, due_date)
            VALUES
                (${id},
                 '${todo}',
                 '${category}',
                 '${priority}',
                 '${status}',
                 '${newDate}');
           `;

      await db.run(createTodoQuery);
      response.send("Todo Successfully Added");
      break;
  }
});

//API for Updates the details of a specific todo based on the todo ID
app.put("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const todoProperty = request.body;

  let updateColumn = "";

  switch (true) {
    case todoProperty.status !== undefined:
      updateColumn = "Status";
      break;
    case todoProperty.priority !== undefined:
      updateColumn = "Priority";
      break;
    case todoProperty.todo !== undefined:
      updateColumn = "Todo";
      break;
    case todoProperty.category !== undefined:
      updateColumn = "Category";
      break;
    case todoProperty.dueDate !== undefined:
      updateColumn = "Due Date";
      break;
  }

  const previousTodoQuery = `
  SELECT
    *
  FROM
    todo
  WHERE
    id = ${todoId};
  `;
  const previousTodo = await db.get(previousTodoQuery);

  const {
    todo = previousTodo.todo,
    priority = previousTodo.priority,
    status = previousTodo.status,
    category = previousTodo.category,
    dueDate = previousTodo.due_date,
  } = request.body;

  switch (false) {
    case isPriorityValid(priority):
      response.status(400);
      response.send("Invalid Todo Priority");
      break;

    case isStatusValid(status):
      response.status(400);
      response.send("Invalid Todo Status");
      break;

    case isCategoryValid(category):
      response.status(400);
      response.send("Invalid Todo Category");
      break;
    case isValid(new Date(dueDate)):
      response.status(400);
      response.send("Invalid Due Date");
      break;
    default:
      const newDate = format(new Date(dueDate), "yyyy-MM-dd");

      const updateTodoQuery = `
        UPDATE 
            todo
        SET
            todo = '${todo}',
            priority = '${priority}',
            status = '${status}',
            category = '${category}',
            due_date = '${newDate}'
        WHERE
            id = ${todoId};
        `;

      await db.run(updateTodoQuery);
      response.send(`${updateColumn} Updated`);
  }
});

//API for Deletes a todo from the todo table based on the todo ID
app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;

  const deleteTodoQuery = `
    DELETE FROM 
    todo
    WHERE
        id = ${todoId};
    `;

  await db.run(deleteTodoQuery);
  response.send("Todo Deleted");
});

module.exports = app;
