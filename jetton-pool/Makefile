#!make

build: clean
	func -S -o build/main.code.fif -W build/main.code.boc func/main.fc
	fift build/main.code.fif

	func -S -o build/store.code.fif -W build/store.code.boc func/store.fc
	fift build/store.code.fif

clean:
	@rm -rf build/*code*
