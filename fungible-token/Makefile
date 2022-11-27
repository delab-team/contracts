#!make

build: clean
	- func -S -o build/root.code.fif -W build/root.code.boc func/root.fc
	- func -S -o build/wall.code.fif -W build/wall.code.boc func/wall.fc

	- fift build/root.code.fif
	- fift build/wall.code.fif

clean:
	- rm -rf build/*code*

tlbcrc:
	- @tlbcrc scheme.tlb -f "\
	query::internal_transfer,\
	query::transfer,\
	query::transfer_notification,\
	query::wall_burn,\
	query::root_constructor,\
	query::root_burn_notification,\
	query::root_mint,\
	query::root_set_metadata,\
	query::root_transfer_ownership,\
	query::provide_wallet_address,\
	response::take_wallet_address"
