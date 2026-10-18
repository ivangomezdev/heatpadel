// Shared SQL uses positional ? parameters. Values are always sent separately.
// Quoted SQL literals/identifiers are skipped so their punctuation is untouched.
export function postgresStatement(statement) {
  let index = 0;
  return statement.replace(/'(?:''|[^'])*'|"(?:""|[^"])*"|\?/g, (token) =>
    token === "?" ? `$${++index}` : token,
  );
}

function resultOf(result) {
  const numeric = new Set([
    "startsAt",
    "createdAt",
    "completedAt",
    "points",
    "played",
    "wins",
    "position",
    "count",
  ]);
  const results = result.rows.map((row) =>
    Object.fromEntries(
      Object.entries(row).map(([key, value]) => {
        if (value !== null && numeric.has(key)) {
          const number = Number(value);
          if (!Number.isSafeInteger(number))
            throw new Error("Invalid database number");
          return [key, number];
        }
        return [key, value];
      }),
    ),
  );
  return {
    results,
    meta: { changes: result.rowCount ?? result.affectedRows ?? 0 },
  };
}

export function createPostgresDatabase(query, batch) {
  function prepare(sql, params = []) {
    return {
      sql: postgresStatement(sql),
      params,
      bind(...values) {
        return prepare(sql, values);
      },
      async all() {
        return resultOf(await query(this.sql, this.params));
      },
      async first() {
        return (await this.all()).results[0] ?? null;
      },
      async run() {
        return this.all();
      },
    };
  }
  return {
    dialect: "postgres",
    prepare,
    async batch(statements) {
      return (await batch(statements)).map(resultOf);
    },
  };
}
