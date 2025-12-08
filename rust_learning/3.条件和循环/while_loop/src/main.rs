fn main() {
    // 条件语句
    let number = 3;
    if number < 5 {
        println!("条件为 true");
    } else {
        println!("条件为 false");
    }
    
    // 编译报错
    // if number {
    //     println!("true");
    // }

    // for循环遍历
    let a = [10, 20, 20, 30, 50];
    for i in 0..a.len() { // 0-len 
        print!("{} ", a[i]);
    }
    println!("");
    for i in a {
        print!("{} ", i);
    }
    println!("");
    for i in a {
        print!("{} ", i);
    }
    println!("");
    for i in a.iter() { // 不可变引用
        print !("{} ", i);
    }
    println!("");

    // for修改元素
    let mut a = [String::from("A"), String::from("B")];
    for i in 0..a.len() {
        a[i] = String::from("C");
    }
    println!("{:?}", a);
    for value in a.iter_mut() {
        (*value) = String::from("D");
    }
    println!("{:?}", a);

    // for遍历同时获取index
    for (_idx, _val) in a.iter().enumerate() {

    }

    // while循环
    let mut number = 1;
    while number != 4 {
        println!("{}", number);
        number += 1;
    }

    // loop循环
    let s = ['R', 'U', 'N', 'O', 'O', 'B'];
    let mut i = 0;
    let location = loop {
        let ch = s[i];
        if ch == 'O' {
            break i;
        }
        i += 1;
    };
    println!(" \'O\' 的索引为 {}", location);
}
