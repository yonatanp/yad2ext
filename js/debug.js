chrome.storage.onChanged.addListener(function(changes, namespace) {
	for (key in changes) {
		var storageChange = changes[key];
		console.log('Storage key "%s" in namespace "%s" changed. Old -> New:',
			key, namespace,
			storageChange.oldValue,
			storageChange.newValue
		);
	}
});
