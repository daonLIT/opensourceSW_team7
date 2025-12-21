import * as SQLite from "expo-sqlite";

let db: SQLite.SQLiteDatabase | null = null;

// 1. DB 초기화
export const initDB = async () => {
  if (db) return;
  db = await SQLite.openDatabaseAsync("fridge.db");
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS ingredients (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      expiry INTEGER NOT NULL,   -- D-day (남은 일수)
      icon TEXT,
      category TEXT
    );
  `);
};

// ------------------------------------------------------
// 2. 식재료 추가
// ------------------------------------------------------
export const addIngredient = async (
  userId: string,        // (현재는 사용하지 않지만 향후 확장 대비)
  name: string,
  expiry: number,        // D-day 형태로 저장됨 (예: 3)
  category: string,
  onSuccess: () => void
) => {
  if (!db) await initDB();

  // 카테고리별 아이콘 자동 배정
  let icon = "🍎";
  if (category === "채소") icon = "🥬";
  if (category === "육류") icon = "🥩";
  if (category === "유제품") icon = "🥛";
  if (category === "해산물") icon = "🐟";
  if (category === "가공식품") icon = "🥫";
  if (category === "양념/기타") icon = "🧂";

  try {
    await db?.runAsync(
      "INSERT INTO ingredients (name, expiry, icon, category) VALUES (?, ?, ?, ?);",
      name,
      expiry,
      icon,
      category
    );
    onSuccess();
  } catch (error) {
    console.error("Insert Error: ", error);
  }
};

// ------------------------------------------------------
// 3. 전체 조회 (유저 기준)
// ------------------------------------------------------
export const getIngredients = async (
  userId: string,
  setItems: (items: any[]) => void
) => {
  if (!db) await initDB();
  try {
    const allRows = await db?.getAllAsync(
      "SELECT * FROM ingredients ORDER BY expiry ASC;"
    );
    setItems(allRows || []);
  } catch (error) {
    console.error("Select Error: ", error);
  }
};

// ------------------------------------------------------
// 4. 삭제
// ------------------------------------------------------
export const deleteIngredient = async (
  userId: string,
  id: number,
  onSuccess: () => void
) => {
  if (!db) await initDB();
  try {
    await db?.runAsync("DELETE FROM ingredients WHERE id = ?;", id);
    onSuccess();
  } catch (error) {
    console.error("Delete Error: ", error);
  }
};

// ------------------------------------------------------
// 5. 수정
// ------------------------------------------------------
export const updateIngredient = async (
  userId: string,
  id: number,
  name: string,
  expiry: number,
  category: string,
  onSuccess: () => void
) => {
  if (!db) await initDB();
  try {
    let icon = "🍎";
    if (category === "채소") icon = "🥬";
    if (category === "육류") icon = "🥩";
    if (category === "유제품") icon = "🥛";
    if (category === "해산물") icon = "🐟";
    if (category === "가공식품") icon = "🥫";
    if (category === "양념/기타") icon = "🧂";

    await db?.runAsync(
      "UPDATE ingredients SET name = ?, expiry = ?, category = ?, icon = ? WHERE id = ?;",
      name,
      expiry,
      category,
      icon,
      id
    );
    onSuccess();
  } catch (error) {
    console.error("Update Error: ", error);
  }
};

// ------------------------------------------------------
// 6. 유통기한 임박(<=3일) 식재료 개수 조회 기능 ★ 핵심 추가 ★
// ------------------------------------------------------
export const getExpiringSoonCount = async (
  userId: string
): Promise<number> => {

  interface ExpiryCountRow {
    count: number;
  }

  if (!db) await initDB();
  try {
    const rows = await db?.getAllAsync(
      "SELECT COUNT(*) AS count FROM ingredients WHERE expiry <= 3;"
    ) as ExpiryCountRow[];

    if (!rows || rows.length === 0) return 0;

    return rows[0].count;
  } catch (error) {
    console.error("Expiry Count Error: ", error);
    return 0;
  }
};

//ㅁㄴㅇㅁㅇㄴㅁㄴㅇㅁㄴㅇ