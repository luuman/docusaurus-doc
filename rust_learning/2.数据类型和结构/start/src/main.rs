
fn type_of<T>(_: &T) -> &'static str {
    std::any::type_name::<T>()
}

fn size_of<T>(_: &T) -> usize {
    std::mem::size_of::<T>()
}

fn inster_utf8_str(index: usize, input: &mut String, insert_str: &str) -> bool {
    if index > input.chars().count() {
        return false;
    }
    let mut i = 0;
    let mut byte_count = 0;
    let bytes = input.as_bytes();
    
    loop {
        if index == i {
            break;
        }
        let byte = bytes[byte_count];
        
        if (byte >> 7) == 0 { // 最高位为0 表示一个字节
            byte_count = byte_count + 1;
        } else {
            if (byte >> 5) == 0b110 { // 2字节
                byte_count = byte_count + 2;
            } else if (byte >> 4) == 0b1110 { // 三字节
                byte_count = byte_count + 3;
            } else if (byte >> 3) == 0b1110 { // 四字节
                byte_count = byte_count + 4;
            } else {
                return false;
            }
        }
        i += 1;
    }
    input.insert_str(byte_count, insert_str);
    return true;
}

fn main() {
    // 类型和操作
    let a = 32; // 默认i32
    let b = 4.0; // 默认f32
    let c = a / (b as i32); //运算时需要强制类型转换
    println!("c: {}", c);

    // 进制
    let num10 = 1_2_3_4_5; // 10进制，数字间可以用下滑线隔开，这在一些金额大数字方面比较利于开发人员快速理解数值
    let num16 = 0xF_fFF; // 16进制，这里不区分大小写，而且也可以用下划线隔开
    let num8 = 0o70; // 8进制
    let num2 = 0b1111_1111; // 二进制
    let byte = b'8'; // ascii 
    println!("num10: {}, num16: {}, num8: {}, num2: {}, byte: {}", num10, num16, num8, num2, byte);
    println!("num10: {}, num16: {:x}, num8: {:o}, num2: {:b}, byte: {}", num10, num16, num8, num2, byte);

    // 字符
    let character: char = 'a';
    println!("字符'a'占用了{}字节的内存大小, 其值为{}",std::mem::size_of_val(&character), character as i32);

    // 字符串
    let ss = "Hello";
    println!("ss 类型:{}, 占用:{}", type_of(&ss), size_of(&ss));

    let ss1 = String::from("Hello");
    println!("ss1 类型:{}, 占用:{}", type_of(&ss1), size_of(&ss1));

    let ss2 = &ss1;
    println!("ss2 类型:{}, 占用:{}", type_of(&ss2), size_of(&ss2));

    // 字符串追加
    let mut ss3 = String::from("Hello ");
    ss3.push_str("world");
    println!("ss3追加字符串 push_str() -> {}", ss3);

    let ss4 = &mut ss3;
    ss4.push_str("蜡笔小新");
    println!("ss4追加字符串 push_str() -> {}", ss4);

    // 字符串插入
    let mut ss5 = String::from("Hello world");
    ss5.insert_str(6, "蜡笔小新 ");
    println!("ss5插入字符串 push_str() -> {}, 字符串长度 {} {}", ss5, ss5.len(), ss5.chars().count());

    // let ss6 = &mut ss5;
    // ss6.insert_str(8, "5"); // 这里的index并不像其他语言中是UTF8或者UTF16的字符个数，这里是占用字节的index， 引发崩溃
    // println!("ss6插入字符串 push_str() -> {}", ss6);

    // 自定义utf8插入
    inster_utf8_str(8, &mut ss5, "5");
    println!("ss5插入字符串 push_str() -> {}", ss5);

    // 字符串替换
    let mut ss7 = String::from("Hello 111 蜡笔小新 111");
    let ss8 = ss7.replace("111", "world");
    let ss9 = ss7.replacen("111", "world", 1);
    println!("ss7替换字符串 push_str() -> ss7:{} ss8:{} ss9:{}", ss7, ss8, ss9);

    let ss10 = &mut ss7;
    ss10.replace_range(6..10, "world ");
    println!("ss10替换字符串 push_str() -> ss10:{}", ss10);

    // 字符串删除
    let mut ss11 = String::from("hello 中国");
    let ch1 = ss11.pop();
    if let Some(ch) = ch1 {
        println!("pop string {}", ch);
    }
    ss11.remove(0); // idx指的是字节，依然需要正确解析UTF8
    println!("pop string {}", ss11);
    ss11.truncate(4);
    println!("truncate string {}", ss11);
    ss11.clear();
    println!("clear string {}", ss11);

    // 字符串拼接
    let string_append = String::from("hello ");
    let string_rust = String::from("rust");
    let result = string_append + &string_rust;
    // 类似 let result = string_append.add(&string_rust);
    println!("result: {}", result);

    let s4 = "hello";
    let s5 = String::from("rust");
    let s6 = format!("{} {}!", s4, s5);
    println!("s6: {}", s6);

    // 切片
    let slice_str = String::from("hello world");
    let slice1 = &slice_str[0..5];
    let slice2 = &slice_str[6..11];
    println!("slice1: {}, size_of slice1 {}, type_of slice1 {}, slice2: {}", slice1, size_of(&slice1), type_of(&slice1), slice2);

    let a = [1, 2, 3, 4, 5];
    let slice = &a[1..3];
    println!("slice: {:?}, size_of slice {}, type_of slice {}", slice, size_of(&slice), type_of(&slice));

    // 元组
    let tup: (u8, u64, u16) = (10, 5, 1);
    println!("size_of tup: {}, type_of tup: {}", size_of(&tup), type_of(&tup));
    println!("tup: ({}, {}, {})", tup.0, tup.1, tup.2);
    let (x, y, _) = tup;
    println!("x: {}, y: {}", x, y);

    let tup1: (u8, u64, u16) = (10, 5, 1);
    unsafe { // 通过内存读写直接修改u8的值
        let tup_ptr: *const (u8, u64, u16) = &tup1 as *const (u8, u64, u16);
        let first_element_ptr = tup_ptr as *mut u8;
        let second_element_ptr: *mut u8 = first_element_ptr.offset(8);
        *second_element_ptr = 20;
    }
    println!("tup1: ({}, {}, {})", tup1.0, tup1.1, tup1.2);

    // 数组
    let mut a: [i32; 10] = [0; 10];
    a[5] = 10;
    println!("a: {:?}, size_of a: {}, type_of a: {}, ", a, size_of(&a), type_of(&a));
    for i in a  {
        println!("i :{}", i);
    }

    // 字符串和数组互转
    let str_array = ["aaa", "bbb", "ccc", "ddd", "eee"];
    let str = str_array.join(",");
    println!("array join res {} type {} size_of {}", str, type_of(&str), size_of(&str));
    let array: Vec<&str> = str.split(",").collect();
    println!("split str res {:?} type {} size_of {}", array, type_of(&array), size_of(&array));
}
