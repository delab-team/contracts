#!make

build: clean
	func -S -o build/main.code.fif -W build/main.code.boc func/main.fc
	fift build/main.code.fif

tlbcrc:
	tlbcrc scheme.tlb -f "query::constructor"

clean:
	@rm -rf build/*code*
