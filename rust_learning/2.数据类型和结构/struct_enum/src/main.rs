use std::mem;


#[derive(Debug)]
enum Book {
    Papery, // 纸质书
    Electronic, // 电子书
}

// #[derive(Debug)]
// enum Book {
//     Papery = -1, // 纸质书
//     Electronic = 202, // 电子书
// }

#[derive(Debug)]
enum Book1 {
    Papery(u32), // 纸质书的索引
    Electronic(String), // 电子书地址
}

#[derive(Debug)]
enum Book2 {
    Papery {
        index: u32,
    },
    Electronic {
        address: String,
    }
}

#[derive(Debug)]
enum Direction {
    East,
    West,
    North,
    South,
}

#[derive(Debug)]
struct Site {
    domain: String,
    name: String,
    nation: String,
    found: u32
}

struct Rectangle {
    width: u32,
    height: u32,
}
   
impl Rectangle {
    fn area(&self) -> u32 {
        self.width * self.height
    }

    fn create(width: u32, height: u32) -> Rectangle {
        Rectangle { width, height }
    }
}

fn main() {
    // 普通枚举
    let book: Book = Book::Papery;
    println!("book val is {:?}, size is {}", book, std::mem::size_of_val(&book));
    println!("Book::Papery val {}, Book::Electronic val {}", Book::Papery as i64, Book::Electronic as i64);
    // let book = 1u8 as Book; // 报错
    
    // 元组枚举
    let book1 = Book1::Electronic("www.baidu.com".to_string());
    println!("{:?}， size_of {}", book1, mem::size_of_val(&book1));
    if let Book1::Electronic(adress) = &book1 {
        println!("book1 is Electronic , adress is {}", adress);
    }
    
    // 结构体枚举
    let book2 = Book2::Papery {index: 101};
    println!("{:?} size_of {}", book2, mem::size_of_val(&book2));
    if let Book2::Papery { index } = &book2 {
        println!("book2 is Papery , index is {}", index);
    }

    // match语句匹配刚才的三种枚举
    match book {
        Book::Papery => println!("这是纸质书"),
        Book::Electronic => println!("这是电子书"),
    }

    match book1 {
        Book1::Papery(_) => println!("这是纸质书 省略编号"),
        Book1::Electronic(address) => println!("此书的地址是 address: {}", address),
    }

    match book2 {
        Book2::Papery { index } => println!("此书的编号是 index: {}", index),
        Book2::Electronic { address } => println!("此书的地址是 address: {}", address),
    }

    let dire = Direction::South;
    match dire {
        Direction::East => println!("East"),
        Direction::North | Direction::South => {
            println!("South or North");
        },
        _ => println!("West"),
    };

    // Option
    let book3 = Some(Book::Papery);
    println!("{:?}", book3);

    let book4: Option<Book> = None;
    println!("{:?}", book4);

    if let Option::Some(book) = book3 {
        println!("book3 is {:?}", book);
    }

    match book4 {
        Option::Some(book) => println!("book4 is {:?}", book),
        Option::None => println!("book4 is nothing")
    }

    let book5 = Some(Book::Papery);
    let b: Book;
    if let Option::Some(book) = book5 {
        b = book;
    } else {
        return;
    } 
    println!("b is {:?}", b);

    // 结构体
    let site = Site {
        domain: String::from("www.rust-lang.org"),
        name: String::from("Rust"),
        nation: String::from("China"),
        found: 2018
    };
    println!("site is {:#?}", site);

    // 更新结构体部分成员
    let site1 = Site {
        domain: String::from("www.runoob.org"),
        name: String::from("RUNOOB"),
        ..site
    };
    println!("site1 is {:#?}", site1);

    // 元组结构体
    struct Color(i32, i32, i32);
    struct Point(i32, i32, i32);

    let black = Color(0, 0, 0);
    let origin = Point(0, 0, 0);
    println!("{} {} {}", origin.0, origin.1, origin.2);
    let Color(_x, _y, _z) = black;

    // 结构体函数和关联函数
    let rect = Rectangle::create(30, 50);
    let area = rect.area();
    println!("area is {}", area);
}
