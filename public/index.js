var app = new Vue({
    el: '#app',
    data: {
        linkName: '',
        link: '',
        nameError: false,
    },
    computed: {
        linkSlug() {
            return this.linkName
                ? slugify(this.linkName)
                : hashCode(this.link)
        },
        linkError() {
            return this.link && !isValidUrl(this.link)
        }
    },
    methods: {
        handleName(ev) {
            const val = ev.target.value
            this.nameError = false
            if (val) {
                this.checkAvailability(val)  
            }
        },
        handleSaveAndCopy() {
            this.save()
            copy(this.linkSlug)
        },
        save(name, link) {
            fetch(`register/${this.linkSlug}?link=${this.link}`, { method: 'POST' })
            .then(response => {
                if (response.status === 302) {
                    this.nameError = true
                }
                else {
                    this.linkName = ''
                    this.link = ''
                }
            })
        },
        checkAvailability(name) {
            debounceFn(() => {
                fetch(`register/${name}`)
                .then(response => {
                    if (response.status !== 404) {
                        this.nameError = true
                    }
                })
            })
        }
    }
})

function copy(linkName) {
    const i = document.querySelector('.copy-stage')
    i.value = `https://12li.ga/${linkName}`
    i.select()
    i.setSelectionRange(0, 99999) /*For mobile devices*/
    document.execCommand("copy")
    console.log('copied')
}

function isValidUrl(string) {
    try {
        new URL(string);
    } catch (_) {
        return false;
    }

    return true;
}

//5 digits long hash code
function hashCode(s) {
    return s.split("")
        .reduce(function (a, b) { a = ((a << 5) - a) + b.charCodeAt(0); return a & a }, 0)
        .toString()
        .match(/(..?)/g)
        .reduce((a, c) => a + (parseInt(c) % 32).toString(32), '')
        .replace(/-/, '')
}

function debounceFn(fn) {
    if (window.debounceTimer) {
        clearTimeout(window.dounceTimer)
    }

    window.dounceTimer = window.setTimeout(fn, 300)
}