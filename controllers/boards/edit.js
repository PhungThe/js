var BoardEditController = Composer.Controller.extend({
	elements: {
		'input[type="text"]': 'inp_title'
	},

	events: {
		'click a[href=#manage]': 'open_manager',
		'submit form': 'edit_board'
	},

	board: null,
	profile: null,

	// if true, opens management modal after successful update
	return_to_manage: false,

	init: function()
	{
		if(!this.board) this.board = new Board();
		this.render();
		modal.open(this.el);
		var close_fn = function() {
			this.release();
			modal.removeEvent('close', close_fn);
		}.bind(this);
		modal.addEvent('close', close_fn);
		this.inp_title.focus();
		tagit.keyboard.detach(); // disable keyboard shortcuts while editing
	},

	release: function()
	{
		tagit.keyboard.attach(); // re-enable shortcuts
		this.parent.apply(this, arguments);
	},

	render: function()
	{
		var content = Template.render('boards/edit', {
			return_to_manage: this.return_to_manage,
			board: toJSON(this.board)
		});
		this.html(content);
	},

	edit_board: function(e)
	{
		if(e) e.stop();
		var title = this.inp_title.get('value');
		var success = null;
		if(this.board.is_new())
		{
			this.board = new Board({title: title});
			this.board.generate_key();
			this.board.generate_subkeys();
			success = function() {
				// make sure the project key gets saved with the user's data
				tagit.user.add_user_key(this.board.id(), this.board.key);

				var boards = this.profile.get('boards');
				if(boards) boards.add(this.board);
				if(!this.return_to_manage)
				{
					// only set the new board as current if we are NOT going
					// back to the manage modal.
					this.profile.set_current_board(this.board);
				}
			}.bind(this);
		}
		else
		{
			this.board.set({title: title});
		}
		tagit.loading(true);
		this.board.save({
			success: function() {
				tagit.loading(false);
				if(success) success();
				modal.close();

				if(this.return_to_manage)
				{
					this.open_manager();
				}
			}.bind(this),
			error: function(_, err) {
				tagit.loading(false);
				barfr.barf('There was a problem saving your board: '+ err);
			}
		});
	},

	open_manager: function(e)
	{
		if(e) e.stop();
		modal.close();

		// open management back up
		new BoardManageController({
			collection: this.profile.get('boards')
		});
	}
});
