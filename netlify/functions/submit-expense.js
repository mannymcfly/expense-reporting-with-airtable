// netlify/functions/submit-expense.js
const Airtable = require("airtable");

const { AIRTABLE_API_KEY, AIRTABLE_BASE_ID, AIRTABLE_TABLE_ID } = process.env;

const base = new Airtable({ apiKey: AIRTABLE_API_KEY }).base(AIRTABLE_BASE_ID);

exports.handler = async function (event, context) {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: "Method not allowed" }),
    };
  }

  let name;
  let expenses;

  try {
    const body = JSON.parse(event.body || "{}");
    name = body.name;
    expenses = body.expenses;
    if (!name || !Array.isArray(expenses)) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Missing name or expenses array" }),
      };
    }
  } catch (err) {
    console.error("Error parsing body", err);
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "Invalid JSON body" }),
    };
  }

  try {
    // Create one record per expense
    const recordsToCreate = expenses.map((expense) => ({
      fields: {
          Date: expense.date,
          "Expense Type": expense.type,
          Vendor: expense.vendor,
          Cost: parseFloat(expense.total) || 0,
          Tax: parseFloat(expense.tax) || 0,
          User: name,
          Attachments: expense.attachments.map((file) => ({
              url: file.url,
              filename: file.filename,
})),
}
    }));

    // TABLE can be by name or ID; you used "tblfUfVjeGnLpLWzN"
    const created = await base(AIRTABLE_TABLE_ID || "tblfUfVjeGnLpLWzN").create(
      recordsToCreate
    );

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "Success",
        count: created.length,
      }),
    };
  } catch (error) {
    console.error("Airtable error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
};
