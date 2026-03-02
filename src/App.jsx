import React, { useState } from "react";

export default function App() {
  const [authenticated, setAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);
  const [showError, setShowError] = useState(false);
  const [expenses, setExpenses] = useState([
    { date: "", type: "", vendor: "", total: "", tax: "", attachments: [] }
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
    setExpenses([...expenses, { date: "", type: "", vendor: "", total: 0, tax: 0, attachments: [] }]);
  };

  const removeExpense = (index) => {
    const updatedExpenses = expenses.filter((_, i) => i !== index);
    setExpenses(updatedExpenses);
  };

  const uploadToCloudinary = async (file) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", "ExpenseReport");
    const res = await fetch("https://api.cloudinary.com/v1_1/daihotlu3/auto/upload", { method: "POST", body: formData });
    const data = await res.json();
    return { url: data.secure_url, filename: file.name };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setShowError(false);
    try {
      const expensesWithUrls = await Promise.all(
        expenses.map(async (expense) => ({
          ...expense,
          attachments: await Promise.all(expense.attachments.map((file) => uploadToCloudinary(file))),
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
        setShowError(true);
        return;
      }

      const data = await res.json();
      console.log("Success:", data);
      setShowSuccess(true);

    } catch (err) {
      console.error("Error:", err);
      setShowError(true);
    }
  };

  const handleSuccessClose = () => {
    setShowSuccess(false);
    setName("");
    setExpenses([{ date: "", type: "", vendor: "", total: "", tax: "", attachments: [] }]);
  };

  if (!authenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
        <div className="bg-white p-6 rounded-2xl shadow-lg w-full max-w-sm">
          <h2 className="text-2xl font-semibold mb-6 text-center">Expense Portal Login</h2>
          <input
            type="password"
            placeholder="Enter password"
            className="w-full p-3 border rounded-xl mb-4 focus:outline-none focus:ring-2 focus:ring-black"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleLogin()}
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
    <div className="min-h-screen bg-gray-50 p-3 sm:p-6">

      {/* SUCCESS POPUP */}
      {showSuccess && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-sm text-center">
            <div className="text-5xl mb-4">✅</div>
            <h2 className="text-2xl font-bold text-green-600 mb-2">Submitted!</h2>
            <p className="text-gray-600 mb-6">Your expenses were submitted successfully.</p>
            <button
              onClick={handleSuccessClose}
              className="w-full bg-black text-white px-6 py-3 rounded-xl hover:opacity-90 transition"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* ERROR POPUP */}
      {showError && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-sm text-center">
            <div className="text-5xl mb-4">❌</div>
            <h2 className="text-2xl font-bold text-red-600 mb-2">Submission Failed</h2>
            <p className="text-gray-600 mb-6">Something went wrong. Please try again or contact support.</p>
            <button
              onClick={() => setShowError(false)}
              className="w-full bg-black text-white px-6 py-3 rounded-xl hover:opacity-90 transition"
            >
              Try Again
            </button>
          </div>
        </div>
      )}

      <div className="max-w-4xl mx-auto bg-white p-4 sm:p-8 rounded-2xl shadow-lg">
        <h1 className="text-2xl sm:text-3xl font-semibold mb-6">Submit Expenses</h1>

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
            <div key={index} className="mb-6 p-4 sm:p-6 border rounded-2xl bg-gray-50">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold">Expense #{index + 1}</h2>
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                    type="date"
                    required
                    className="w-full p-3 border rounded-xl appearance-none bg-white text-gray-700"
                    style={{ minHeight: '48px' }}
                    value={expense.date}
                    onChange={(e) => handleExpenseChange(index, "date", e.target.value)}
                  />


                <select
                  required
                  className="w-full p-3 border rounded-xl bg-white"
                  value={expense.type}
                  onChange={(e) => handleExpenseChange(index, "type", e.target.value)}
                >
                  <option value="">Select Expense Type</option>
                  <option value="Childrens Ministry">Childrens Ministry</option>
                  <option value="Liability Insurance">Liability Insurance</option>
                  <option value="Other Wages">Other Wages</option>
                  <option value="Miscellaneous Taxes">Miscellaneous Taxes</option>
                  <option value="Miscellaneous">Miscellaneous</option>
                  <option value="Payroll Taxes">Payroll Taxes</option>
                  <option value="Bank Fees">Bank Fees</option>
                  <option value="Conferences">Conferences</option>
                  <option value="TN Baptist Association">TN Baptist Association</option>
                  <option value="Software/Website">Software/Website</option>
                  <option value="Equipment">Equipment</option>
                  <option value="Benevolence Fund">Benevolence Fund</option>
                  <option value="Missionary Support">Missionary Support</option>
                  <option value="Pastoral Ministry">Pastoral Ministry</option>
                  <option value="Books/Resources">Books/Resources</option>
                  <option value="Supplies">Supplies</option>
                  <option value="Meeting Expenses">Meeting Expenses</option>
                  <option value="Events">Events</option>
                </select>

                <input
                  type="text"
                  placeholder="Vendor Name"
                  required
                  className="w-full p-3 border rounded-xl"
                  value={expense.vendor}
                  onChange={(e) => handleExpenseChange(index, "vendor", e.target.value)}
                />

                <input
                  type="number"
                  step="0.01"
                  placeholder="Total Amount"
                  required
                  className="w-full p-3 border rounded-xl"
                  value={expense.total}
                  onChange={(e) => handleExpenseChange(index, "total", e.target.value)}
                />

                <input
                  type="number"
                  step="0.01"
                  placeholder="Tax"
                  required
                  className="w-full p-3 border rounded-xl"
                  value={expense.tax}
                  onChange={(e) => handleExpenseChange(index, "tax", e.target.value)}
                />

                <input
                  type="file"
                  multiple
                  className="w-full p-3 border rounded-xl text-sm"
                  onChange={(e) => handleFileChange(index, e.target.files)}
                />
              </div>
            </div>
          ))}

          <button
            type="button"
            onClick={addExpense}
            className="w-full sm:w-auto mb-6 px-5 py-3 border rounded-xl hover:bg-gray-100 transition"
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
