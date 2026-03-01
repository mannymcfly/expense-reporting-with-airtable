import React, { useState } from "react";



export default function App() {
  const [authenticated, setAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [expenses, setExpenses] = useState([
    {
      date: "",
      type: "",
      vendor: "",
      total: "",
      tax: "",
      attachments: []
    }
  ]);

  const correctPassword = "gfstewardship";



  const handleLogin = () => {
    if (password === correctPassword) {
      setAuthenticated(true);
    } else {
      alert("Incorrect password");
    }
  };

  const handleExpenseChange = (index, field, value) => {
    const updatedExpenses = [...expenses];
    updatedExpenses[index][field] = value;
    setExpenses(updatedExpenses);
  };

  const handleFileChange = (index, files) => {
    const updatedExpenses = [...expenses];
    updatedExpenses[index].attachments = Array.from(files);
    setExpenses(updatedExpenses);
  };

  const addExpense = () => {
    setExpenses([
      ...expenses,
      {
        date: "",
        type: "",
        vendor: "",
        total:0,
        tax: 0,
        attachments: []
      }
    ]);
  };

  const removeExpense = (index) => {
    const updatedExpenses = expenses.filter((_, i) => i !== index);
    setExpenses(updatedExpenses);
  };

const uploadToCloudinary = async (file) => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", "ExpenseReport");

  const res = await fetch(
    "https://api.cloudinary.com/v1_1/daihotlu3/auto/upload",
    { method: "POST", body: formData }
  );
  const data = await res.json();
  return { url: data.secure_url, filename: file.name };
};

const handleSubmit = async (e) => {
  e.preventDefault();

  try {
    const expensesWithUrls = await Promise.all(
      expenses.map(async (expense) => ({
        ...expense,
        attachments: await Promise.all(
          expense.attachments.map((file) => uploadToCloudinary(file))
        ),
      }))
    );

    const res = await fetch("/.netlify/functions/submit-expense", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, expenses: expensesWithUrls }),
    });

    if (!res.ok) {
      const errBody = await res.text();
      console.error("Error from function:", res.status, errBody);
      return;
    }

    const data = await res.json();
    console.log("Success:", data);
  } catch (err) {
    console.error("Error:", err);
  }
};

  if (!authenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="bg-white p-8 rounded-2xl shadow-lg w-96">
          <h2 className="text-2xl font-semibold mb-6 text-center">
            Expense Portal Login
          </h2>
          <input
            type="password"
            placeholder="Enter password"
            className="w-full p-3 border rounded-xl mb-4 focus:outline-none focus:ring-2 focus:ring-black"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button
            onClick={handleLogin}
            className="w-full bg-black text-white p-3 rounded-xl hover:opacity-90 transition"
          >
            Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto bg-white p-8 rounded-2xl shadow-lg">
        <h1 className="text-3xl font-semibold mb-6">Submit Expenses</h1>

        <form onSubmit={handleSubmit}>
          {/* Name */}
          <div className="mb-8">
            <label className="block mb-2 font-medium">Your Name</label>
            <input
              type="text"
              required
              className="w-full p-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-black"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          {/* Expenses */}
          {expenses.map((expense, index) => (
            <div
              key={index}
              className="mb-8 p-6 border rounded-2xl bg-gray-50"
            >
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold">
                  Expense #{index + 1}
                </h2>
                {expenses.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeExpense(index)}
                    className="text-red-500 text-sm"
                  >
                    Remove
                  </button>
                )}
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <input
                  type="date"
                  required
                  className="p-3 border rounded-xl"
                  value={expense.date}
                  onChange={(e) =>
                    handleExpenseChange(index, "date", e.target.value)
                  }
                />

                <select
                  required
                  className="p-3 border rounded-xl"
                  value={expense.type}
                  onChange={(e) =>
                    handleExpenseChange(index, "type", e.target.value)
                  }
                >
                  <option value="">Select Expense Type</option>
                  <option value="Travel">Travel</option>
                  <option value="Meals">Meals</option>
                  <option value="Supplies">Supplies</option>
                  <option value="Lodging">Lodging</option>
                  <option value="Other">Other</option>
                </select>

                <input
                  type="text"
                  placeholder="Vendor Name"
                  required
                  className="p-3 border rounded-xl"
                  value={expense.vendor}
                  onChange={(e) =>
                    handleExpenseChange(index, "vendor", e.target.value)
                  }
                />

                <input
                  type="number"
                  step="0.01"
                  placeholder="Total Amount"
                  required
                  className="p-3 border rounded-xl"
                  value={expense.total}
                  onChange={(e) =>
                    handleExpenseChange(index, "total", e.target.value)
                  }
                />

                <input
                  type="number"
                  step="0.01"
                  placeholder="Tax"
                  required
                  className="p-3 border rounded-xl"
                  value={expense.tax}
                  onChange={(e) =>
                    handleExpenseChange(index, "tax", e.target.value)
                  }
                />

                <input
                  type="file"
                  multiple
                  className="p-3 border rounded-xl"
                  onChange={(e) =>
                    handleFileChange(index, e.target.files)
                  }
                />
              </div>
            </div>
          ))}

          <button
            type="button"
            onClick={addExpense}
            className="mb-6 px-5 py-3 border rounded-xl hover:bg-gray-100 transition"
          >
            + Add Another Expense
          </button>

          <div>
            <button
              type="submit"
              className="w-full bg-black text-white p-4 rounded-2xl text-lg hover:opacity-90 transition"
            >
              Submit Expenses
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}