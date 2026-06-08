import { useEffect } from "react";
import { supabase } from "../lib/supabase";

function TestSupabase() {
  useEffect(() => {
  async function test() {
    const { data, error } = await supabase
      .from("categorie")
      .select("*");

    console.log("DATA :", data);
    console.log("ERROR :", error);
  }

  test();
}, []);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <h1 className="text-3xl font-bold">
        Test Supabase
      </h1>
    </div>
  );
}

export default TestSupabase;