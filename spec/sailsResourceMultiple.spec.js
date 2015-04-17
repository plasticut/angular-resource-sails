describe('multiple sailsResources', function() {
	beforeEach(module('sailsResource'));
	var service1, service2, socket;

	beforeEach(inject(function (mockSocket, $window) {
		socket = mockSocket;
		$window.io = {
			socket: mockSocket
		};
	}));

	beforeEach(function() {
		inject(function(sailsResource) {
			service1 = sailsResource('widget', null, {
				socket: socket,
				verbose: true,
				prefix: 'api'
			});

			service2 = sailsResource('widget', null, {
				socket: socket,
				verbose: true,
				prefix: 'api'
			});
		});

		jasmine.addMatchers({
			toEqualValues: function() {
				return {
					compare: function(actual, expected) {
						return {
							pass: JSON.stringify(actual) == JSON.stringify(expected)
						};
					}
				};
			}
		});
	});

	afterEach(function() {
		socket.flush();
	});

	describe('arrays', function() {

		var list1, list2, originalCount;
		beforeEach(function() {
			list1 = service1.query();
			list2 = service2.query();
			socket.flush();
			originalCount = list1.length;
		});

		it('should have different lists with the same data', function() {
			expect(list1).not.toBe(list2);
			expect(list1).toEqualValues(list2);
		});

		it('should send created messages asynchronously', function() {

			var newItem = new service1();
			newItem.$save();

			expect(list1.length).toEqual(originalCount, 'list1 has correct original count');
			expect(list2.length).toEqual(originalCount, 'list2 has correct original count');

			socket.flush();
			expect(list1.length).toEqual(originalCount+1, 'list1 has correct updated count');
			expect(list2.length).toEqual(originalCount+1, 'list2 has correct updated count');
		});

		it('should send updated messages asynchronously', function() {
			expect(list2[0].data).toEqual(list1[0].data);

			list1[0].data = 'zzz';
			list1[0].$save();

			expect(list2[0].data).not.toEqual(list1[0].data);
			socket.flush();
			expect(list2[0].data).toEqual(list1[0].data);
		});

		it('should send destroyed messages asynchronously', function() {
			expect(list1.length).toEqual(list2.length);
			list1[0].$delete();
			socket.flush();
			expect(list1.length).toEqual(list2.length);
		});
	});

	describe('instances', function() {
		var item1, item2;
		beforeEach(function() {
			item1 = service1.get({id:1});
			item2 = service2.get({id:1});
			socket.flush();
		});

		it('should be different objects with the same data', function() {
			expect(item1).not.toBe(item2);
			expect(item1.id).toEqual(item2.id);
			expect(item1.data).toEqual(item2.data);
		});

		it('should send updated messages asynchronously', function() {
			item1.data = 'zzz';
			item1.$save();
			expect(item1).not.toEqual(item2);
			socket.flush();
			expect(item1.id).toEqual(item2.id);
			expect(item1.data).toEqual(item2.data);
		});

		it('should send destroyed messages asynchronously', function() {
			item1.$delete();
			socket.flush();
			var item3 = service2.get({id:1});
			expect(item3.data).toBeUndefined();
		});

	});

});