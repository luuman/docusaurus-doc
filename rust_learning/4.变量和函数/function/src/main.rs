// 两数之和
fn add(a: i32, b: i32) -> i32 {
    a + b
}

// 两数之积
fn multiply(a: i32, b: i32) -> i32 {
    a * b
}

// 传入参数和操作函数求值
fn result(a: i32, b: i32, expr: fn(i32, i32) -> i32) -> i32 {
    expr(a, b)
}

enum Operator {
    Add,
    Multiply,
}

fn get_operation(opt: Operator) -> fn(i32, i32) -> i32 {
    match opt {
        Operator::Add => add,
        Operator::Multiply => multiply,
    }
}

fn main() {
    // 函数调用 两数之和
    let a = add(1, 2);
    println!("a = {}", a);

    // 函数体表达式，其中不能出现return
    let y = {
        let x = 3;
        x + 1
    };
    println!("y = {}", y);

    // 函数作为参数
    let sum_result = result(1, 2, add);
    println!("sum_result = {}", sum_result);
    let multiply_result = result(3, 4, multiply);
    println!("product_result = {}", multiply_result);

    // 函数作为返回值
    let sum_result1 = result(1, 2, get_operation(Operator::Add));
    println!("sum_result1 = {}", sum_result1);
    let multiply_result1 = result(3, 4, get_operation(Operator::Multiply));
    println!("product_result1 = {}", multiply_result1);
}


