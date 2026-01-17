use std::process::{Command, exit};

fn main() {
    println!("\n========================================");
    println!("RUST LOG ANALYZER - EVALUATION");
    println!("========================================\n");

    println!("Building project...");
    let build_status = Command::new("cargo")
        .arg("build")
        .arg("--release")
        .status()
        .expect("Failed to execute cargo build");

    if !build_status.success() {
        eprintln!("❌ Build failed!");
        exit(1);
    }
    println!("✅ Build successful\n");

    println!("Running tests...");
    let test_output = Command::new("cargo")
        .arg("test")
        .arg("--release")
        .arg("--")
        .arg("--nocapture")
        .output()
        .expect("Failed to execute cargo test");

    println!("{}", String::from_utf8_lossy(&test_output.stdout));
    
    if !test_output.status.success() {
        eprintln!("\n❌ Tests failed!");
        eprintln!("{}", String::from_utf8_lossy(&test_output.stderr));
        exit(1);
    }

    println!("\n========================================");
    println!("✅ ALL TESTS PASSED");
    println!("========================================\n");
    
    println!("Sample Usage:");
    println!("  ./target/release/loganalyzer tests/sample.log");
    println!("  ./target/release/loganalyzer tests/sample.log --status 4xx");
    println!("  ./target/release/loganalyzer tests/sample.log --from \"2023-10-10 14:00\"");
    println!();
}
