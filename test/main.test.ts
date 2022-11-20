import { removeDuplicates, Payment } from "../src/main";

const prev: Payment[] = [
  {
    id: "ID_1",
    date: new Date("2022-01-01T00:00:00"),
    store: "STORE_1",
    content: "CONTENT_1",
    price: 1000
  },
  {
    id: "ID_2",
    date: new Date("2022-01-02T00:00:00"),
    store: "STORE_2",
    content: "CONTENT_2",
    price: 2000
  }
]

const current = [
  {
    id: "ID_2",
    date: new Date("2022-01-02T00:00:00"),
    store: "STORE_2",
    content: "CONTENT_2",
    price: 2000
  },
  {
    id: "ID_3",
    date: new Date("2022-01-03T00:00:00"),
    store: "STORE_3",
    content: "CONTENT_3",
    price: 3000
  }
]

describe("remove duplicated payments", () => {
  it("should get only unique payments", () => {
    console.log(removeDuplicates(prev, current))
    expect(removeDuplicates(prev, current)).toEqual([
      {
        id: "ID_3",
        date: new Date("2022-01-03T00:00:00"),
        store: "STORE_3",
        content: "CONTENT_3",
        price: 3000
      },
    ])
  });
});
