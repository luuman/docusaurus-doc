
// 常量函数
const fn expr() -> i32 {
    let a = 10;
    a + 20
}

fn main() {
    // 变量和不可变变量的权限
    let a = 10;
    // a = 20; // 报错因为a不可变
    let mut b: i32 = 10;
    println!("a: {}, b: {}", a, b); // 此行不写会报错 maybe it is overwritten before being read?
    b = 20;
    println!("a: {}, b: {}", a, b);

    
    // 常量
    const NUM: i32 = 123;
    let result = expr();
    println!("NUM: {}, result: {}", NUM, result);

    // 重影
    let x = 10; 
    let x = 20; // 覆盖第一个，会产生警告
    println!("x: {}", x);
}
