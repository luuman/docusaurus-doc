fn main() {

    // 不可变引用的无限叠加
    let s = String::from("11");
    let s1 = &s;
    let s2 = &s1;
    let _count = s2.chars().count();



    // 可变引用修改原始内存
    let mut ss = String::from("11");
    let ss1 = &mut ss;
    ss1.push_str(" 22");
    println!("ss {}", ss1);
    (*ss1) = String::from("你好");
    println!("ss {}", ss);


    // 可变引用同一时刻只能存在一份
    let mut s = String::from("hello");
    let r1 = &mut s;
    // let r2 = &mut s; // cannot borrow `s` as mutable more than once at a time
    // println!("{}, {}", r1, r2);


    // 可变引用和不可变引用不能同时存在
    let mut s = String::from("hello");
    let r1 = &s;
    let r2 = &s;
    // let r3 = &mut s; // cannot borrow `s` as mutable because it is also borrowed as immutable
    // println!("{}, {}, and {}", r1, r2, r3);
    
}
